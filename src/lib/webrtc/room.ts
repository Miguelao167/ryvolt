// =============================================
// RYVOLT - Voice/Video Room orchestrator
// =============================================
// Mantém a lista de participantes de uma sala de voz/vídeo, abre
// e fecha PeerConnections, expõe eventos pra UI reagir.

import { PeerConnection } from './peer'
import { getSignalingAdapter } from './signaling'
import { getMediaManager } from './media'
import { useMediaSettingsStore } from '@/stores/mediaSettingsStore'
import type { ConnectionState, Participant } from './types'

export interface RoomOptions {
  channelId: string
  communityId: string
  selfId: string
  selfDisplayName: string
  selfAvatar?: string | null
  /** Discoverable list of other user ids to mesh with (mesh topology) */
  knownPeerIds?: string[]
  /**
   * Optional: tie this room to a DM thread instead of a community channel.
   * When set, the signaling uses dm:{dmThreadId} as the room key, so two
   * users opening the same DM thread connect to each other regardless of
   * being in the same community.
   */
  dmThreadId?: string
}

export type RoomEvent =
  | { kind: 'participant-joined'; participant: Participant }
  | { kind: 'participant-left'; userId: string }
  | { kind: 'participant-updated'; participant: Participant }
  | { kind: 'stream'; userId: string; stream: MediaStream }
  | { kind: 'state'; state: ConnectionState }
  | { kind: 'error'; error: Error }

export type RoomListener = (ev: RoomEvent) => void

export class VoiceRoom {
  readonly channelId: string
  readonly communityId: string
  readonly selfId: string
  /** Effective signaling room id. For community channels same as channelId;
   * for DMs it's `dm:{threadId}` so two users in the same DM connect. */
  readonly roomId: string

  private selfDisplayName: string
  private selfAvatar: string | null
  private participants = new Map<string, Participant>()
  private peers = new Map<string, PeerConnection>()
  private listeners = new Set<RoomListener>()
  private unsubscribers: Array<() => void> = []
  private joined = false
  private localStream: MediaStream | null = null
  private pendingOffers = new Map<string, RTCSessionDescriptionInit>()
  private pendingAnswers = new Map<string, RTCSessionDescriptionInit>()
  private pendingIce = new Map<string, RTCIceCandidateInit[]>()

  constructor(opts: RoomOptions) {
    this.channelId = opts.channelId
    this.communityId = opts.communityId
    this.roomId = opts.dmThreadId ? `dm:${opts.dmThreadId}` : opts.channelId
    this.selfId = opts.selfId
    this.selfDisplayName = opts.selfDisplayName
    this.selfAvatar = opts.selfAvatar ?? null

    // Seed self into participants
    this.participants.set(this.selfId, {
      userId: this.selfId,
      displayName: this.selfDisplayName,
      avatarUrl: this.selfAvatar,
      state: 'idle',
      muted: false,
      deafened: false,
      videoOff: false,
      isStreaming: false,
      speaking: false,
      audioLevel: 0,
      joinedAt: Date.now(),
    })

    if (opts.knownPeerIds) {
      for (const pid of opts.knownPeerIds) {
        if (pid === this.selfId) continue
        this.participants.set(pid, {
          userId: pid,
          displayName: pid.slice(0, 6),
          avatarUrl: null,
          state: 'idle',
          muted: false,
          deafened: false,
          videoOff: false,
          isStreaming: false,
          speaking: false,
          audioLevel: 0,
          joinedAt: Date.now(),
        })
      }
    }
  }

  on(listener: RoomListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(ev: RoomEvent) {
    this.listeners.forEach((l) => l(ev))
  }

  /**
   * Join the room. Acquires local media, signals presence, sets up
   * peer connections as other members arrive.
   */
  async join(opts: { audio: boolean; video: boolean }): Promise<void> {
    if (this.joined) return
    this.joined = true

    const media = getMediaManager()
    this.localStream = await media.acquire(opts)

    // Subscribe to audio level for local self speaking detection
    media.onLevel((level, speaking) => {
      const self = this.participants.get(this.selfId)
      if (self) {
        self.audioLevel = level
        if (self.speaking !== speaking) {
          self.speaking = speaking
          this.emit({ kind: 'participant-updated', participant: self })
        }
      }
      // Broadcast speaking state to others (throttled)
      if (speaking) {
        void getSignalingAdapter().send(this.roomId, {
          type: 'speaking',
          from: this.selfId,
          payload: { level },
        })
      }
    })

    // Wire signaling
    const signaling = getSignalingAdapter()
    signaling.setUserId(this.selfId)
    await signaling.connect(this.selfId)

    const offMsg = signaling.onMessage(async (env) => {
      if (env.room !== this.roomId) return
      const msg = env.msg
      if (msg.from === this.selfId) return // ignore self echoes
      await this.handleSignal(msg)
    })
    this.unsubscribers.push(offMsg)

    await signaling.join(this.roomId)

    // Announce presence
    await signaling.send(this.roomId, {
      type: 'join',
      from: this.selfId,
      payload: {
        displayName: this.selfDisplayName,
        avatarUrl: this.selfAvatar,
      },
    })

    // Update self state
    const existingSelf = this.participants.get(this.selfId)
    if (!existingSelf) {
      this.participants.set(this.selfId, {
        userId: this.selfId,
        displayName: this.selfDisplayName,
        avatarUrl: this.selfAvatar,
        state: 'idle',
        muted: false,
        deafened: false,
        videoOff: false,
        isStreaming: false,
        speaking: false,
        audioLevel: 0,
        joinedAt: Date.now(),
      })
    }
    const self = this.participants.get(this.selfId)!
    self.state = 'connected'
    this.emit({ kind: 'participant-updated', participant: self })
    this.emit({ kind: 'state', state: 'connected' })
  }

  leave(): void {
    if (!this.joined) return
    this.joined = false
    this.unsubscribers.forEach((u) => u())
    this.unsubscribers = []
    for (const peer of Array.from(this.peers.values())) peer.close()
    this.peers.clear()
    void getSignalingAdapter().send(this.roomId, {
      type: 'leave',
      from: this.selfId,
    })
    void getSignalingAdapter().leave(this.roomId)
    getMediaManager().release()
    this.localStream = null
    this.participants.clear()
    this.pendingOffers.clear()
    this.pendingAnswers.clear()
    this.pendingIce.clear()
    this.emit({ kind: 'state', state: 'closed' })
  }

  /** Mute / unmute local mic (also tracks kind 'audio') */
  setMuted(muted: boolean): void {
    const media = getMediaManager()
    media.setMuted('audio', muted)
    const self = this.participants.get(this.selfId)
    if (self) {
      self.muted = muted
      self.deafened = self.deafened && muted ? self.deafened : self.deafened
      this.emit({ kind: 'participant-updated', participant: self })
    }
    // Tell peers
    void getSignalingAdapter().send(this.roomId, {
      type: 'mute-state',
      from: this.selfId,
      payload: { muted },
    })
  }

  setDeafened(deafened: boolean): void {
    const self = this.participants.get(this.selfId)
    if (self) {
      self.deafened = deafened
      if (deafened) {
        // Deafening mutes outgoing + remote audio playback
        this.setMuted(true)
        for (const peer of Array.from(this.peers.values())) {
          // mute remote inbound audio by detaching receivers
          const receivers = (peer as unknown as { pc: RTCPeerConnection }).pc.getReceivers()
          receivers.forEach((r) => {
            if (r.track?.kind === 'audio' && r.track) {
              r.track.enabled = false
            }
          })
        }
      } else {
        // Un-deafen also unmutes
        this.setMuted(false)
        for (const peer of Array.from(this.peers.values())) {
          const receivers = (peer as unknown as { pc: RTCPeerConnection }).pc.getReceivers()
          receivers.forEach((r) => {
            if (r.track?.kind === 'audio' && r.track) {
              r.track.enabled = true
            }
          })
        }
      }
      this.emit({ kind: 'participant-updated', participant: self })
    }
  }

  setVideoOff(off: boolean): void {
    const media = getMediaManager()
    media.setTrackEnabled('video', !off)
    const self = this.participants.get(this.selfId)
    if (self) {
      self.videoOff = off
      this.emit({ kind: 'participant-updated', participant: self })
    }
  }

  /** Snapshot of participants */
  getParticipants(): Participant[] {
    return Array.from(this.participants.values())
  }

  private async handleSignal(msg: import('./types').SignalMessage) {
    const signaling = getSignalingAdapter()
    switch (msg.type) {
      case 'join': {
        const p = msg.payload as { displayName: string; avatarUrl?: string | null } | undefined
        const userId = msg.from
        const existing = this.participants.get(userId)
        if (existing) {
          existing.state = 'connecting'
          existing.displayName = p?.displayName ?? existing.displayName
          existing.avatarUrl = p?.avatarUrl ?? existing.avatarUrl
        } else {
          this.participants.set(userId, {
            userId,
            displayName: p?.displayName ?? userId.slice(0, 6),
            avatarUrl: p?.avatarUrl ?? null,
            state: 'connecting',
            muted: false,
            deafened: false,
            videoOff: false,
            isStreaming: false,
            speaking: false,
            audioLevel: 0,
            joinedAt: Date.now(),
          })
        }
        const part = this.participants.get(userId)!
        this.emit({ kind: 'participant-joined', participant: part })
        // Open a connection to the new peer. Use lower user id as the
        // "polite" peer so glare is resolved deterministically.
        this.openPeerConnection(userId)
        break
      }

      case 'leave': {
        this.peers.get(msg.from)?.close()
        this.peers.delete(msg.from)
        this.participants.delete(msg.from)
        this.emit({ kind: 'participant-left', userId: msg.from })
        break
      }

      case 'offer': {
        const sdp = msg.payload as RTCSessionDescriptionInit
        const peer = await this.ensurePeer(msg.from)
        await peer.handleOffer(sdp)
        break
      }

      case 'answer': {
        const sdp = msg.payload as RTCSessionDescriptionInit
        const peer = this.peers.get(msg.from)
        if (peer) await peer.handleAnswer(sdp)
        break
      }

      case 'ice': {
        const candidate = msg.payload as RTCIceCandidateInit
        const peer = await this.ensurePeer(msg.from)
        await peer.handleIce(candidate)
        break
      }

      case 'mute-state': {
        const { muted } = (msg.payload as { muted: boolean }) || {}
        const p = this.participants.get(msg.from)
        if (p) {
          p.muted = muted
          this.emit({ kind: 'participant-updated', participant: p })
        }
        break
      }

      case 'speaking': {
        const { level } = (msg.payload as { level: number }) || {}
        const p = this.participants.get(msg.from)
        if (p) {
          p.audioLevel = level
          // Speak threshold is owned by the receiver — they decide what
          // level counts as "talking" for their UI, not the sender.
          const threshold = useMediaSettingsStore.getState().speakingThreshold
          const speaking = level > threshold
          if (p.speaking !== speaking) {
            p.speaking = speaking
            this.emit({ kind: 'participant-updated', participant: p })
          }
        }
        break
      }
    }
  }

  private async ensurePeer(remoteId: string): Promise<PeerConnection> {
    let peer = this.peers.get(remoteId)
    if (peer) return peer
    return this.openPeerConnection(remoteId)
  }

  private async openPeerConnection(remoteId: string): Promise<PeerConnection> {
    if (this.peers.has(remoteId)) return this.peers.get(remoteId)!

    // Polite peer is the one with the smaller id (deterministic)
    const polite = this.selfId < remoteId

    const peer = new PeerConnection({
      selfId: this.selfId,
      remoteId,
      roomId: this.roomId,
      localStream: this.localStream,
      polite,
      onTrack: (stream) => {
        const p = this.participants.get(remoteId)
        if (p) {
          p.stream = stream
          this.emit({ kind: 'stream', userId: remoteId, stream })
          this.emit({ kind: 'participant-updated', participant: p })
        }
      },
      onStateChange: (state) => {
        const p = this.participants.get(remoteId)
        if (p) {
          p.state = state as ConnectionState
          this.emit({ kind: 'participant-updated', participant: p })
        }
        if (state === 'failed') {
          // Try ICE restart
          peer['pc']?.createOffer({ iceRestart: true }).then((offer) => {
            return peer['pc']?.setLocalDescription(offer)
          }).then(() => {
            void getSignalingAdapter().send(this.roomId, {
              type: 'offer',
              from: this.selfId,
              to: remoteId,
              payload: peer['pc']?.localDescription,
            })
          }).catch((err) => console.warn('ice restart failed', err))
        }
      },
    })

    this.peers.set(remoteId, peer)

    // Kick off the offer immediately. Perfect-negotiation relies on
    // `onnegotiationneeded` firing once we add tracks, but that callback
    // can race with the remote peer also sending an offer, leaving both
    // sides stuck. Spinning up the offer here (when we're polite OR when
    // we created the peer before the remote did) avoids the deadlock.
    try {
      const offer = await peer['pc'].createOffer()
      await peer['pc'].setLocalDescription(offer)
      await getSignalingAdapter().send(this.roomId, {
        type: 'offer',
        from: this.selfId,
        to: remoteId,
        payload: peer['pc'].localDescription,
      })
    } catch (err) {
      console.warn('[VoiceRoom] initial offer failed', err)
    }

    return peer
  }
}