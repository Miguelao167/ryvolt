'use client'

import { useEffect, useRef, useState } from 'react'

interface MicTestResult {
  level: number
  speaking: boolean
  error: string | null
}

/**
 * Opens a temporary mic stream so the user can preview level + try the
 * selected device. Returns the latest level (0..1) and speaking flag,
 * plus a stop() callback the caller must invoke when leaving the page.
 */
export function useMicTest(opts: {
  deviceId?: string | null
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  threshold?: number
}) {
  const [state, setState] = useState<MicTestResult>({
    level: 0,
    speaking: false,
    error: null,
  })

  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufferRef = useRef<Uint8Array | null>(null)

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
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.6
        source.connect(analyser)
        analyserRef.current = analyser
        const buffer = new Uint8Array(analyser.frequencyBinCount)
        bufferRef.current = buffer

        const threshold = opts.threshold ?? 0.02
        const tick = () => {
          if (cancelled || !analyserRef.current || !bufferRef.current) return
          analyserRef.current.getByteFrequencyData(bufferRef.current)
          let sum = 0
          for (let i = 0; i < bufferRef.current.length; i++) sum += bufferRef.current[i]
          const avg = sum / bufferRef.current.length
          const level = Math.min(1, avg / 128)
          const speaking = level > threshold
          setState({ level, speaking, error: null })
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch (err: any) {
        if (!cancelled) {
          setState({
            level: 0,
            speaking: false,
            error: err?.message ?? 'Não foi possível acessar o microfone',
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
    opts.threshold,
  ])

  return state
}
