// =============================================
// RYVOLT - Media capture & device management
// =============================================

import type { MediaDeviceInfo, MediaDeviceKind } from './types'
import { useMediaSettingsStore } from '@/stores/mediaSettingsStore'

/**
 * Gerencia captura de áudio/vídeo local. Cuida do getUserMedia,
 * enumeração de devices, mute/unmute e análise de nível de áudio.
 */
export class MediaManager {
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array | null = null
  private rafId: number | null = null
  private levelListeners = new Set<(level: number, speaking: boolean) => void>()
  /** Separate stream for screen sharing — kept apart from camera/mic */
  private screenStream: MediaStream | null = null
  private screenListeners = new Set<(s: MediaStream | null) => void>()

  /** Get current local stream (or null if not started) */
  getStream(): MediaStream | null {
    return this.stream
  }

  /** Get all tracks of a kind from the local stream */
  getTracks(kind: 'audio' | 'video'): MediaStreamTrack[] {
    if (!this.stream) return []
    return kind === 'audio'
      ? this.stream.getAudioTracks()
      : this.stream.getVideoTracks()
  }

  /**
   * Acquire user media. Caller specifies which kinds to enable.
   * Reads device + processing preferences from mediaSettingsStore.
   * Returns the resulting stream. Idempotent — call again to change kinds.
   */
  async acquire(opts: { audio: boolean; video: boolean }): Promise<MediaStream> {
    const settings = useMediaSettingsStore.getState()

    // If already have a stream, just toggle tracks
    if (this.stream) {
      this.setTrackEnabled('audio', opts.audio)
      this.setTrackEnabled('video', opts.video)
      return this.stream
    }

    const constraints: MediaStreamConstraints = {
      audio: opts.audio
        ? {
            deviceId: settings.micDeviceId ? { exact: settings.micDeviceId } : undefined,
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
          }
        : false,
      video: opts.video
        ? {
            deviceId: settings.cameraDeviceId ? { exact: settings.cameraDeviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    this.applyInputVolume(settings.inputVolume)

    if (opts.audio) {
      this.startAudioAnalysis()
    }

    return this.stream
  }

  /** Live-apply input gain to the running stream via a Web Audio gain node. */
  private applyInputVolume(volume: number): void {
    if (!this.stream) return
    if (!this.audioContext) this.audioContext = new AudioContext()
    if (!this.gainNode) {
      const source = this.audioContext.createMediaStreamSource(this.stream)
      const gain = this.audioContext.createGain()
      gain.gain.value = volume
      // Connect to a muted sink so the source is "alive" but not audible locally
      const sink = this.audioContext.createMediaStreamDestination()
      gain.connect(sink)
      source.connect(gain)
      this.gainNode = gain
    } else {
      this.gainNode.gain.value = volume
    }
  }

  /** Stop all tracks and release stream */
  release(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => undefined)
      this.audioContext = null
    }
    this.gainNode = null
    this.analyser = null
    this.dataArray = null
  }

  /** Mute / unmute specific kind */
  setMuted(kind: 'audio' | 'video', muted: boolean): void {
    if (!this.stream) return
    this.stream.getTracks().forEach((t) => {
      if (t.kind === kind) t.enabled = !muted
    })
  }

  /** Toggle a kind's enabled state */
  setTrackEnabled(kind: 'audio' | 'video', enabled: boolean): void {
    if (!this.stream) return
    this.stream.getTracks().forEach((t) => {
      if (t.kind === kind) t.enabled = enabled
    })
  }

  /** Live-update input gain (0..1). */
  setInputVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume))
    if (this.gainNode) {
      this.gainNode.gain.value = v
    } else {
      this.applyInputVolume(v)
    }
  }

  /** Enumerate input devices */
  async getDevices(kind?: MediaDeviceKind): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return []
    const all = await navigator.mediaDevices.enumerateDevices()
    return all
      .filter((d) => !kind || d.kind === kind)
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `${d.kind} (${d.deviceId.slice(0, 6)})`,
        kind: d.kind as MediaDeviceKind,
      }))
  }

  /**
   * Switch to a specific input device. Releases the current stream
   * and re-acquires with the new constraints (browser API quirk).
   */
  async switchDevice(
    kind: 'audioinput' | 'videoinput',
    deviceId: string,
  ): Promise<void> {
    if (kind === 'audioinput') {
      if (this.stream) this.release()
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: useMediaSettingsStore.getState().echoCancellation,
          noiseSuppression: useMediaSettingsStore.getState().noiseSuppression,
          autoGainControl: useMediaSettingsStore.getState().autoGainControl,
        },
      })
      this.startAudioAnalysis()
    } else {
      if (!this.stream) return
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      })
      const newTrack = newStream.getVideoTracks()[0]
      const oldTrack = this.stream.getVideoTracks()[0]
      if (oldTrack) {
        this.stream.removeTrack(oldTrack)
        oldTrack.stop()
      }
      if (newTrack) this.stream.addTrack(newTrack)
    }
  }

  /** Subscribe to audio level updates (called via rAF) */
  onLevel(cb: (level: number, speaking: boolean) => void): () => void {
    this.levelListeners.add(cb)
    return () => this.levelListeners.delete(cb)
  }

  private startAudioAnalysis(): void {
    if (!this.stream) return
    const audioTrack = this.stream.getAudioTracks()[0]
    if (!audioTrack) return

    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    const source = this.audioContext.createMediaStreamSource(this.stream)
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.6
    source.connect(this.analyser)
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    const tick = () => {
      if (!this.analyser || !this.dataArray) return
      this.analyser.getByteFrequencyData(this.dataArray)
      let sum = 0
      for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i]
      const avg = sum / this.dataArray.length
      const level = Math.min(1, avg / 128)
      const threshold = useMediaSettingsStore.getState().speakingThreshold
      const speaking = level > threshold
      this.levelListeners.forEach((cb) => cb(level, speaking))
      this.rafId = requestAnimationFrame(tick)
    }
    tick()
  }

  // ============== Screen share ==============

  /**
   * Start screen capture via getDisplayMedia. Quality hints are mapped from
   * Discord-like "SD" (720p@30) vs "HD" (1080p@60) settings.
   */
  async startScreenShare(opts?: {
    quality?: 'sd' | 'hd'
    fps?: number
    audio?: boolean
  }): Promise<MediaStream> {
    if (this.screenStream) return this.screenStream
    const quality = opts?.quality ?? 'sd'
    const fps = opts?.fps ?? (quality === 'hd' ? 60 : 30)
    const audio = opts?.audio ?? false

    const constraints = {
      video: {
        frameRate: { ideal: fps },
        width: quality === 'hd' ? { ideal: 1920 } : { ideal: 1280 },
        height: quality === 'hd' ? { ideal: 1080 } : { ideal: 720 },
      },
      audio,
    }

    const stream = await navigator.mediaDevices.getDisplayMedia(constraints)
    this.screenStream = stream
    this.screenListeners.forEach((cb) => cb(stream))

    // If user stops sharing via the browser UI ("stop sharing" tooltip),
    // propagate that to our listeners too.
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      this.stopScreenShare()
    })

    return stream
  }

  /** Stop screen capture. */
  stopScreenShare(): void {
    if (!this.screenStream) return
    this.screenStream.getTracks().forEach((t) => t.stop())
    this.screenStream = null
    this.screenListeners.forEach((cb) => cb(null))
  }

  /** Current screen stream (or null). */
  getScreenStream(): MediaStream | null {
    return this.screenStream
  }

  /** Subscribe to screen stream changes (start/stop). */
  onScreenStream(cb: (stream: MediaStream | null) => void): () => void {
    this.screenListeners.add(cb)
    return () => this.screenListeners.delete(cb)
  }
}

/** Singleton — setado em bootstrap, reset on leave */
let current: MediaManager | null = null
export function getMediaManager(): MediaManager {
  if (!current) current = new MediaManager()
  return current
}
export function resetMediaManager(): void {
  current?.release()
  current = null
}
