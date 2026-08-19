'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Cast, X } from 'lucide-react'
import { getMediaManager } from '@/lib/webrtc'
import { useVoiceStore } from '@/stores/voiceStore'

/**
 * Estilo Discord: quando alguém está transmitindo, a tela toma conta do
 * stage principal. O self sempre vê a própria transmissão (loopback local),
 * sem precisar esperar pelo WebRTC peer connection.
 */
export function ScreenSharePreview({ onStop }: { onStop: () => void }) {
  const setIsStreaming = useVoiceStore((s) => s.setIsStreaming)
  const quality = useVoiceStore((s) => s.screenQuality)
  const fps = useVoiceStore((s) => s.screenFps)
  const audio = useVoiceStore((s) => s.screenAudio)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Mantém o <video> conectado ao screenStream do MediaManager.
  useEffect(() => {
    const media = getMediaManager()
    const off = media.onScreenStream((stream) => {
      const el = videoRef.current
      if (!el) return
      if (stream && el.srcObject !== stream) {
        el.srcObject = stream
        el.muted = true // evita feedback do próprio áudio do sistema
        void el.play().catch(() => undefined)
      } else if (!stream) {
        el.srcObject = null
      }
    })

    // Conecta já no mount caso já exista um stream ativo
    const existing = media.getScreenStream()
    if (existing && videoRef.current && videoRef.current.srcObject !== existing) {
      videoRef.current.srcObject = existing
      videoRef.current.muted = true
      void videoRef.current.play().catch(() => undefined)
    }

    return () => off()
  }, [])

  const handleStop = () => {
    const media = getMediaManager()
    media.stopScreenShare()
    setIsStreaming(false)
    onStop()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex flex-col h-full min-h-0"
    >
      {/* Header da transmissão */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
              Transmitindo ao vivo
            </span>
          </div>
          <span className="text-xs text-discord-text-dim">
            {quality.toUpperCase()} · {fps}fps{audio ? ' · áudio' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={handleStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 text-sm font-medium transition-colors"
          title="Parar transmissão"
        >
          <X className="w-4 h-4" />
          Parar transmissão
        </button>
      </div>

      {/* Stage principal: o vídeo de tela */}
      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-black border border-discord-deep relative">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
          <Cast className="w-3.5 h-3.5" />
          Sua tela
        </div>
      </div>
    </motion.div>
  )
}