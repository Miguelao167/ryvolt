'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, MicOff, Headphones, VolumeX, MoreHorizontal, PhoneOff } from 'lucide-react'
import { useVoiceStore } from '@/stores/voiceStore'
import { useAuthStore } from '@/stores/authStore'
import { VoiceParticipantTile } from './VoiceParticipantTile'
import { VideoOverlay, useFocusParticipant } from './VideoOverlay'
import { ScreenSharePreview } from './ScreenSharePreview'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

interface VoiceChannelViewProps {
  channelId: string
  communityId: string
  channelName: string
  /** Show video grid instead of audio-only tiles */
  showVideo?: boolean
}

export function VoiceChannelView({
  channelId,
  communityId,
  channelName,
  showVideo = false,
}: VoiceChannelViewProps) {
  const user = useAuthStore((s) => s.user)
  const join = useVoiceStore((s) => s.join)
  const leave = useVoiceStore((s) => s.leave)
  const activeChannelId = useVoiceStore((s) => s.activeChannelId)
  const connectionState = useVoiceStore((s) => s.connectionState)
  const participantsMap = useVoiceStore((s) => s.participants)
  const isStreaming = useVoiceStore((s) => s.isStreaming)

  // Auto-join when this is the active channel
  useEffect(() => {
    if (!user) return
    if (activeChannelId !== channelId) {
      void join({
        channelId,
        communityId,
        selfId: user.id,
        selfDisplayName: user.displayName ?? user.username,
        selfAvatar: user.avatarUrl,
        withVideo: showVideo,
      })
    }
  }, [channelId, communityId, user, activeChannelId, join, showVideo])

  const participants = useMemo(
    () => Array.from(participantsMap.values()),
    [participantsMap],
  )

  const { focusedId, focus } = useFocusParticipant()
  const gridRef = useRef<HTMLDivElement>(null)

  const count = participants.length
  const gridCols = useMemo(() => {
    if (focusedId) return 'grid-cols-1'
    if (count <= 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 9) return 'grid-cols-3'
    return 'grid-cols-2 md:grid-cols-4'
  }, [count, focusedId])

  return (
    <div className="flex-1 flex flex-col bg-discord-bg min-h-0">
      {/* Header — igual Discord */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-discord-deep shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-5 h-5 text-discord-text-dim shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07l1.42 1.42a7 7 0 0 0 0-9.9l-1.42 1.41z" />
          </svg>
          <span className="font-semibold text-white truncate">
            {channelName}
          </span>
        </div>
      </div>

      {/* Body: stage (centro) + participants list (lateral) */}
      <div className="flex-1 flex min-h-0">
        {/* Stage / grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={gridRef} className="flex-1 overflow-y-auto p-6 relative">
            {showVideo && (
              <VideoOverlay
                focusedId={focusedId}
                onFocus={focus}
                containerRef={gridRef}
              />
            )}
            {connectionState === 'connecting' && (
              <div className="text-center text-discord-text-dim py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="w-8 h-8 mx-auto mb-3 border-2 border-discord-blurple border-t-transparent rounded-full"
                />
                Conectando…
              </div>
            )}

            <AnimatePresence mode="wait">
              {isStreaming ? (
                <motion.div
                  key="streaming"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full min-h-0"
                >
                  <ScreenSharePreview onStop={() => undefined} />
                  {/* Tiles compactos embaixo durante a transmissão */}
                  <div className={cn('grid gap-3 mt-4 grid-cols-3 md:grid-cols-5')}>
                    <AnimatePresence mode="popLayout">
                      {participants.map((p) => (
                        <VoiceParticipantTile
                          key={p.userId}
                          participant={p}
                          isSelf={p.userId === user?.id}
                          showVideo={showVideo}
                          featured={false}
                          onClick={() => focus(focusedId === p.userId ? null : p.userId)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn('grid gap-4', gridCols)}
                >
                  <AnimatePresence mode="popLayout">
                    {participants.map((p) => (
                      <VoiceParticipantTile
                        key={p.userId}
                        participant={p}
                        isSelf={p.userId === user?.id}
                        showVideo={showVideo}
                        featured={focusedId === p.userId}
                        onClick={() => focus(focusedId === p.userId ? null : p.userId)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Painel lateral — lista de participantes conectados */}
        <ParticipantsList participants={participants} selfId={user?.id} onLeave={leave} />
      </div>
    </div>
  )
}

interface ParticipantsListProps {
  participants: { userId: string; displayName: string; avatarUrl?: string | null; muted?: boolean; deafened?: boolean }[]
  selfId?: string
  onLeave: () => void
}

function ParticipantsList({ participants, selfId, onLeave }: ParticipantsListProps) {
  const speakers = participants.filter((p) => !p.muted)
  const muted = participants.filter((p) => p.muted && !p.deafened)
  const deafened = participants.filter((p) => p.deafened)

  return (
    <div className="w-64 border-l border-discord-deep bg-discord-surface flex flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <Section title={`Conectados — ${participants.length}`}>
          {speakers.length > 0 ? (
            speakers.map((p) => (
              <ParticipantItem key={p.userId} p={p} selfId={selfId} muted={false} />
            ))
          ) : (
            <EmptyHint>Ninguém está falando agora</EmptyHint>
          )}
        </Section>

        {muted.length > 0 && (
          <Section title={`Silenciados — ${muted.length}`}>
            {muted.map((p) => (
              <ParticipantItem key={p.userId} p={p} selfId={selfId} muted />
            ))}
          </Section>
        )}

        {deafened.length > 0 && (
          <Section title={`Sem áudio — ${deafened.length}`}>
            {deafened.map((p) => (
              <ParticipantItem
                key={p.userId}
                p={p}
                selfId={selfId}
                muted
                deafened
              />
            ))}
          </Section>
        )}
      </div>

      {/* Botão grande de desligar no rodapé do painel */}
      <div className="p-3 border-t border-discord-deep">
        <button
          onClick={onLeave}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          Desconectar
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-discord-text-dim">
          {title}
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function ParticipantItem({
  p,
  selfId,
  muted,
  deafened,
}: {
  p: { userId: string; displayName: string; avatarUrl?: string | null }
  selfId?: string
  muted?: boolean
  deafened?: boolean
}) {
  return (
    <div className="group flex items-center gap-2 px-1.5 py-1 rounded hover:bg-discord-hover cursor-pointer">
      <div className="relative shrink-0">
        <Avatar src={p.avatarUrl} alt={p.displayName} size="sm" />
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-discord-surface',
            muted
              ? 'bg-red-500 text-white'
              : 'bg-discord-green text-white'
          )}
        >
          {muted ? (
            <MicOff className="w-2 h-2" />
          ) : (
            <Mic className="w-2 h-2" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-sm truncate',
            selfId === p.userId
              ? 'font-semibold text-white'
              : 'text-discord-text-muted'
          )}
        >
          {p.displayName}
          {selfId === p.userId && (
            <span className="ml-1 text-xs text-discord-text-dim">
              (você)
            </span>
          )}
          {deafened && (
            <VolumeX className="inline w-3 h-3 ml-1 text-red-400" />
          )}
        </div>
      </div>
      <MoreHorizontal className="w-4 h-4 text-discord-text-dim opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-2 text-xs text-discord-text-dim italic">
      {children}
    </div>
  )
}
