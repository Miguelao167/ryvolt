'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaSettingsStore } from '@/stores/mediaSettingsStore'
import { useMicPlaybackTest } from '@/hooks/useMicPlaybackTest'

interface MicTestModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal "Teste do microfone" — estilo Discord. Mostra o nível ao vivo e
 * dá um botão "Reproduzir" que faz loopback do mic pelo speaker, pra
 * você ouvir sua própria voz com as configurações atuais.
 */
export function MicTestModal({ open, onClose }: MicTestModalProps) {
  const settings = useMediaSettingsStore()
  const [playing, setPlaying] = useState(false)

  const test = useMicPlaybackTest({
    deviceId: settings.micDeviceId,
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
    threshold: settings.speakingThreshold,
    inputVolume: settings.inputVolume,
    outputVolume: settings.outputVolume,
    playing,
    speakerDeviceId: settings.speakerDeviceId,
  })

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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-discord-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-discord-deep"
          >
            <div className="flex items-center justify-between p-4 border-b border-discord-deep">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-discord-blurple" />
                <h2 className="text-base font-semibold text-white">
                  Teste do microfone
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

            <div className="p-6 space-y-5">
              {test.error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {test.error}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'text-xs font-semibold w-16 tabular-nums',
                          test.speaking
                            ? 'text-green-400'
                            : test.level > 0.005
                              ? 'text-yellow-400'
                              : 'text-discord-text-dim',
                        )}
                      >
                        {test.speaking ? 'FALANDO' : 'SILÊNCIO'}
                      </span>
                      <div className="flex-1 h-3 bg-discord-bg rounded-full overflow-hidden border border-discord-deep">
                        <div className="flex h-full">
                          {Array.from({ length: 30 }).map((_, i) => {
                            const segLevel = (i + 1) / 30
                            const active = test.level >= segLevel * 0.7
                            return (
                              <div
                                key={i}
                                className={cn(
                                  'flex-1 mx-px transition-all',
                                  test.speaking
                                    ? active
                                      ? 'bg-green-500'
                                      : 'bg-green-500/15'
                                    : test.level > 0.005
                                      ? active
                                        ? 'bg-yellow-500'
                                        : 'bg-yellow-500/15'
                                      : 'bg-gray-600/40',
                                )}
                              />
                            )
                          })}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-discord-text-dim tabular-nums w-12 text-right">
                        {(test.level * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPlaying((p) => !p)}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-colors',
                        playing
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-discord-blurple hover:bg-discord-blurple-hover text-white',
                      )}
                    >
                      {playing ? (
                        <>
                          <Square className="w-4 h-4 fill-current" />
                          Parar reprodução
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Reproduzir
                        </>
                      )}
                    </button>
                  </div>

                  {playing && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-md p-2 border border-amber-500/20">
                      <VolumeX className="w-4 h-4 shrink-0" />
                      <span>
                        Cuidado com o volume do alto-falante — você vai ouvir sua
                        própria voz em tempo real.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-3 bg-discord-bg border-t border-discord-deep text-xs text-discord-text-dim">
              Fale algo pra testar. Se as barrinhas não se mexerem, troque o
              dispositivo de entrada acima.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
