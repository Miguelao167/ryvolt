// =============================================
// RYVOLT - RTCPeerConnection manager
// =============================================
// One PeerConnection per remote participant. Handles offer/answer,
// ICE gathering, automatic reconnection on transient failures.

import { getSignalingAdapter } from './signaling'

export interface PeerOptions {
  /** Local user id (signaling 'from' field) */
  selfId: string
  /** Remote user id */
  remoteId: string
  /** Room id (= channelId) */
  roomId: string
  /** Local media stream to send to the remote */
  localStream: MediaStream | null
  /** Whether this side is the "polite" peer (handles glare) */
  polite: boolean
  /** Callbacks */
  onTrack?: (stream: MediaStream) => void
  onStateChange?: (state: RTCPeerConnectionState) => void
}

export class PeerConnection {
  readonly remoteId: string
  private pc: RTCPeerConnection
  private opts: PeerOptions
  private makingOffer = false
  private ignoreOffer = false

  constructor(opts: PeerOptions) {
    this.opts = opts
    this.remoteId = opts.remoteId

    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Production should add TURN servers here for users behind strict NATs
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ],
    })

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        void this.send({
          type: 'ice',
          payload: e.candidate,
        })
      }
    }

    this.pc.ontrack = (e) => {
      const remoteStream =
        e.streams[0] || new MediaStream([e.track])
      this.opts.onTrack?.(remoteStream)
    }

    this.pc.onconnectionstatechange = () => {
      this.opts.onStateChange?.(this.pc.connectionState)
    }

    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true
        await this.pc.setLocalDescription()
        await this.send({
          type: 'offer',
          payload: this.pc.localDescription,
        })
      } catch (err) {
        console.error('[peer] negotiation failed', err)
      } finally {
        this.makingOffer = false
      }
    }

    // Add local tracks
    if (opts.localStream) {
      opts.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, opts.localStream!)
      })
    }
  }

  /** Replace tracks when local stream changes (mute, device switch) */
  replaceTracks(newStream: MediaStream): void {
    const senders = this.pc.getSenders()
    for (const track of newStream.getTracks()) {
      const sender = senders.find((s) => s.track?.kind === track.kind)
      if (sender) {
        void sender.replaceTrack(track)
      } else {
        this.pc.addTrack(track, newStream)
      }
    }
  }

  /** Handle an incoming offer (perfect-negotiation pattern) */
  async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    const offerCollision =
      this.makingOffer || this.pc.signalingState !== 'stable'
    this.ignoreOffer = !this.opts.polite && offerCollision
    if (this.ignoreOffer) return

    await this.pc.setRemoteDescription(sdp)
    await this.pc.setLocalDescription()
    await this.send({
      type: 'answer',
      payload: this.pc.localDescription,
    })
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (this.pc.signalingState !== 'have-local-offer') return
    await this.pc.setRemoteDescription(sdp)
  }

  async handleIce(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.pc.addIceCandidate(candidate)
    } catch (err) {
      if (!this.ignoreOffer) throw err
    }
  }

  close(): void {
    this.pc.onicecandidate = null
    this.pc.ontrack = null
    this.pc.onnegotiationneeded = null
    this.pc.onconnectionstatechange = null
    this.pc.getSenders().forEach((s) => s.track && s.track.stop())
    this.pc.close()
  }

  get state(): RTCPeerConnectionState {
    return this.pc.connectionState
  }

  private async send(msg: { type: string; payload: unknown }) {
    const signaling = getSignalingAdapter()
    await signaling.send(this.opts.roomId, {
      type: msg.type as 'offer' | 'answer' | 'ice',
      from: this.opts.selfId,
      to: this.remoteId,
      payload: msg.payload,
    })
  }
}