'use client'

import { useEffect, useRef, useState } from 'react'

interface PlaybackTestResult {
  level: number
  speaking: boolean
  error: string | null
  /** True when user explicitly enabled playback (echoes input through speaker) */
  playing: boolean
}

/**
 * Opens the selected microphone, runs level analysis, and optionally plays
 * the input back through the speakers (echo / loopback test). Caller toggles
 * `playing` to start/stop playback without releasing the mic.
 */
export function useMicPlaybackTest(opts: {
  deviceId?: string | null
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  threshold?: number
  /** 0..1 — applied as input gain */
  inputVolume?: number
  /** 0..1 — applied to output volume via mediaStreamDestination */
  outputVolume?: number
  playing: boolean
  speakerDeviceId?: string | null
}) {
  const [state, setState] = useState<PlaybackTestResult>({
    level: 0,
    speaking: false,
    error: null,
    playing: false,
  })

  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufferRef = useRef<Uint8Array | null>(null)
  const inputGainRef = useRef<GainNode | null>(null)
  const outputGainRef = useRef<GainNode | null | null>(null)
  const speakerDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const outputElRef = useRef<HTMLAudioElement | null>(null)
  const outputStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState((s) => ({ ...s, error: 'API de mídia não suportada neste navegador' }))
      return
    }

    let cancelled = false

    const start = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: {
            deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined,
            echoCancellation: opts.echoCancellation ?? true,
            noiseSuppression: opts.noiseSuppression ?? true,
            autoGainControl: opts.autoGainControl ?? true,
          },
          video: false,
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const Ctor = (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext
        const audioCtx = new Ctor()
        audioCtxRef.current = audioCtx

        const source = audioCtx.createMediaStreamSource(stream)
        sourceNodeRef.current = source

        const inputGain = audioCtx.createGain()
        inputGain.gain.value = opts.inputVolume ?? 1
        inputGainRef.current = inputGain

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.6
        analyserRef.current = analyser
        const buffer = new Uint8Array(analyser.frequencyBinCount)
        bufferRef.current = buffer

        // Wire: source → inputGain → analyser
        //       source → inputGain → speakerDest (when playing)
        source.connect(inputGain)
        inputGain.connect(analyser)

        const speakerDest = audioCtx.createMediaStreamDestination()
        speakerDestRef.current = speakerDest
        const outputGain = audioCtx.createGain()
        outputGain.gain.value = opts.outputVolume ?? 1
        outputGainRef.current = outputGain
        inputGain.connect(outputGain)
        outputGain.connect(speakerDest)

        const threshold = opts.threshold ?? 0.02
        const tick = () => {
          if (cancelled || !analyserRef.current || !bufferRef.current) return
          analyserRef.current.getByteFrequencyData(bufferRef.current)
          let sum = 0
          for (let i = 0; i < bufferRef.current.length; i++) sum += bufferRef.current[i]
          const avg = sum / bufferRef.current.length
          const level = Math.min(1, avg / 128)
          const speaking = level > threshold
          setState((s) => ({ ...s, level, speaking, error: null }))
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch (err: any) {
        if (!cancelled) {
          setState({
            level: 0,
            speaking: false,
            error: err?.message ?? 'Não foi possível acessar o microfone',
            playing: false,
          })
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      analyserRef.current = null
      bufferRef.current = null
      inputGainRef.current = null
      outputGainRef.current = null
      speakerDestRef.current = null
      sourceNodeRef.current = null
      if (outputElRef.current) {
        outputElRef.current.srcObject = null
        outputElRef.current = null
      }
      if (outputStreamRef.current) {
        outputStreamRef.current.getTracks().forEach((t) => t.stop())
        outputStreamRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => undefined)
        audioCtxRef.current = null
      }
    }
  }, [
    opts.deviceId,
    opts.echoCancellation,
    opts.noiseSuppression,
    opts.autoGainControl,
    opts.inputVolume,
  ])

  // Update gains live when settings change
  useEffect(() => {
    if (inputGainRef.current)
      inputGainRef.current.gain.value = opts.inputVolume ?? 1
  }, [opts.inputVolume])
  useEffect(() => {
    if (outputGainRef.current)
      outputGainRef.current.gain.value = opts.outputVolume ?? 1
  }, [opts.outputVolume])

  // Toggle playback (loopback)
  useEffect(() => {
    if (!speakerDestRef.current) return
    if (opts.playing) {
      // Pipe speakerDest → output audio element
      const el = new Audio()
      el.srcObject = speakerDestRef.current.stream
      el.autoplay = true
      // Try to set sink to selected speaker (Chromium-only API)
      const sinkAny = el as unknown as { setSinkId?: (id: string) => Promise<void> }
      if (opts.speakerDeviceId && typeof sinkAny.setSinkId === 'function') {
        sinkAny.setSinkId(opts.speakerDeviceId).catch(() => undefined)
      }
      el.play().catch(() => undefined)
      outputElRef.current = el
      outputStreamRef.current = speakerDestRef.current.stream
      setState((s) => ({ ...s, playing: true }))
    } else {
      if (outputElRef.current) {
        outputElRef.current.srcObject = null
        outputElRef.current = null
      }
      if (outputStreamRef.current) {
        outputStreamRef.current.getTracks().forEach((t) => t.stop())
        outputStreamRef.current = null
      }
      setState((s) => ({ ...s, playing: false }))
    }
  }, [opts.playing, opts.speakerDeviceId])

  return state
}
