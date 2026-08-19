'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, AppWindow, Video, Settings as SettingsIcon, Cast } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceStore } from '@/stores/voiceStore'
import { getMediaManager } from '@/lib/webrtc'

interface ScreenSource {
  id: string
  name: string
  /** 'screen' = full display, 'window' = application window, 'browser' = chrome tab */
  kind: 'screen' | 'window' | 'browser'
  /** Data URL thumbnail for preview */
  thumbnail: string
}

interface ScreenShareModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'applications' | 'screens' | 'devices'

/**
 * Modal estilo Discord pra escolher o que transmitir. Na vida real o
 * browser só consegue listar os sources quando getDisplayMedia é chamado —
 * aqui mostramos a UI de seleção e disparamos o picker do OS quando o
 * usuário escolhe a aba ou clica em "Transmitir".
 */
export function ScreenShareModal({ open, onClose }: ScreenShareModalProps) {
  const [tab, setTab] = useState<Tab>('applications')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isStreaming = useVoiceStore((s) => s.isStreaming)
  const setIsStreaming = useVoiceStore((s) => s.setIsStreaming)
  const quality = useVoiceStore((s) => s.screenQuality)
  const setQuality = useVoiceStore((s) => s.setScreenQuality)
  const fps = useVoiceStore((s) => s.screenFps)
  const setFps = useVoiceStore((s) => s.setScreenFps)
  const audio = useVoiceStore((s) => s.screenAudio)
  const setAudio = useVoiceStore((s) => s.setScreenAudio)

  const [showSettings, setShowSettings] = useState(false)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)

  // Escuta o screen stream do MediaManager pra mostrar preview ao vivo
  useEffect(() => {
    const media = getMediaManager()
    const off = media.onScreenStream((s) => setPreviewStream(s))
    return () => off()
  }, [])

  const stopStreaming = useCallback(() => {
    const media = getMediaManager()
    media.stopScreenShare()
    setIsStreaming(false)
  }, [setIsStreaming])

  const startStreaming = useCallback(async () => {
    setError(null)
    setStarting(true)
    try {
      const media = getMediaManager()
      await media.startScreenShare({
        quality,
        fps,
        audio,
      })
      setIsStreaming(true)
      onClose()
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('Você cancelou a seleção de tela.')
      } else {
        setError(err?.message ?? 'Falha ao iniciar transmissão')
      }
    } finally {
      setStarting(false)
    }
  }, [quality, fps, audio, setIsStreaming, onClose])

  // Cleanup on unmount
  useEffect(() => {
    if (!open) return
    return () => {
      // keep streaming alive across modal closes
    }
  }, [open])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'applications', label: 'Aplicativos', icon: <AppWindow className="w-4 h-4" /> },
    { id: 'screens', label: 'Tela Inteira', icon: <Monitor className="w-4 h-4" /> },
    { id: 'devices', label: 'Dispositivos', icon: <Video className="w-4 h-4" /> },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-discord-surface rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-discord-deep flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-discord-deep">
              <div className="flex items-center gap-2">
                <Cast className="w-5 h-5 text-discord-blurple" />
                <h2 className="text-base font-semibold text-white">
                  {isStreaming ? 'Transmitindo agora' : 'Transmitir sua tela'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-discord-hover text-discord-text-dim"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 border-b border-discord-deep bg-discord-bg">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    tab === t.id
                      ? 'bg-discord-surface text-white shadow'
                      : 'text-discord-text-dim hover:bg-discord-hover hover:text-discord-text-muted',
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {isStreaming && previewStream ? (
                <PreviewPanel stream={previewStream} onStop={stopStreaming} />
              ) : tab === 'devices' ? (
                <DevicesEmpty />
              ) : (
                <PickerEmpty tab={tab} />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 p-4 border-t border-discord-deep bg-discord-bg">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings((s) => !s)}
                  className="p-2 rounded hover:bg-discord-hover text-discord-text-dim"
                  title="Configurações"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
                <span className="text-xs text-discord-text-dim">
                  {quality === 'hd' ? 'HD' : 'SD'} · {fps}fps
                  {audio ? ' · áudio' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopStreaming()
                      onClose()
                    }}
                    className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
                  >
                    Parar transmissão
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-md text-discord-text-muted hover:bg-discord-hover text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={startStreaming}
                      disabled={starting}
                      className="px-4 py-2 rounded-md bg-discord-blurple hover:bg-discord-blurple-hover text-white text-sm font-medium disabled:opacity-50"
                    >
                      {starting ? 'Iniciando...' : 'Transmitir'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Settings drawer */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-discord-deep bg-discord-bg"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Qualidade</span>
                      <div className="flex gap-1 bg-discord-surface rounded-md p-0.5">
                        {(['sd', 'hd'] as const).map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              setQuality(q)
                              if (q === 'hd' && fps < 30) setFps(60)
                              if (q === 'sd' && fps > 30) setFps(30)
                            }}
                            className={cn(
                              'px-3 py-1 text-xs font-bold rounded',
                              quality === q
                                ? 'bg-discord-blurple text-white'
                                : 'text-discord-text-dim hover:text-white',
                            )}
                          >
                            {q.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">FPS</span>
                      <select
                        value={fps}
                        onChange={(e) => setFps(Number(e.target.value))}
                        className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1 text-sm"
                      >
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={60}>60</option>
                      </select>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-white">Capturar áudio</span>
                      <input
                        type="checkbox"
                        checked={audio}
                        onChange={(e) => setAudio(e.target.checked)}
                        className="accent-discord-blurple"
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mx-4 mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PickerEmpty({ tab }: { tab: Tab }) {
  const label =
    tab === 'applications' ? 'aplicativos abertos' :
    tab === 'screens' ? 'telas disponíveis' :
    'dispositivos'

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card
        icon={<AppWindow className="w-8 h-8" />}
        title={tab === 'applications' ? 'Aplicativos abertos' : tab === 'screens' ? 'Tela Inteira' : 'Dispositivos'}
        subtitle="Clique em Transmitir pra abrir o seletor do seu sistema."
        gradient="from-blue-500 to-indigo-600"
      />
      <Card
        icon={<Monitor className="w-8 h-8" />}
        title="Visualização"
        subtitle={`O RYVOLT vai listar seus ${label} depois que você autorizar.`}
        gradient="from-emerald-500 to-teal-600"
      />
    </div>
  )
}

function DevicesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-discord-hover flex items-center justify-center mb-3">
        <Video className="w-6 h-6 text-discord-text-dim" />
      </div>
      <p className="text-sm font-medium text-white">
        Você não tem nenhum dispositivo de captura disponível.
      </p>
      <p className="text-xs text-discord-text-dim max-w-sm mt-1">
        No futuro, você poderá usar esta aba pra transmitir a partir de
        dispositivos específicos, como sua câmera.
      </p>
      <button className="mt-3 text-xs text-discord-blurple hover:underline">
        Saiba Mais
      </button>
    </div>
  )
}

function PreviewPanel({ stream, onStop }: { stream: MediaStream; onStop: () => void }) {
  const videoRefCallback = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el) {
        el.srcObject = stream
      }
    },
    [stream],
  )
  useEffect(() => {
    return () => {
      // cleanup handled by ref callback
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-discord-deep">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRefCallback} autoPlay muted playsInline className="w-full h-full object-contain" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Transmitindo ao vivo
        </div>
        <button
          type="button"
          onClick={onStop}
          className="px-3 py-1.5 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 text-sm font-medium"
        >
          Parar
        </button>
      </div>
    </div>
  )
}

function Card({
  icon,
  title,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  gradient: string
}) {
  return (
    <div className="group rounded-lg border border-discord-deep overflow-hidden hover:border-discord-surface2 transition-colors">
      <div className={cn('aspect-video bg-gradient-to-br flex items-center justify-center text-white/90', gradient)}>
        {icon}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-discord-text-dim mt-1">{subtitle}</div>
      </div>
    </div>
  )
}
