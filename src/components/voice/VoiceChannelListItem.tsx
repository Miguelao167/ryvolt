'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Volume2, Video, Phone, PhoneOff, Mic, MicOff, Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { SpeakingAvatar } from './SpeakingAvatar'
import type { Participant } from '@/lib/webrtc/types'
import type { Channel } from '@/types'

interface VoiceChannelListItemProps {
  channel: Channel
  isActive: boolean
  isInRoom: boolean
  participantCount: number
  /** Lista de participantes conectados (somente preenchida para o canal ativo) */
  participants?: Participant[]
  selfId?: string
  onClick: () => void
  onJoinToggle: () => void
}

export function VoiceChannelListItem({
  channel,
  isActive,
  isInRoom,
  participantCount,
  participants,
  selfId,
  onClick,
  onJoinToggle,
}: VoiceChannelListItemProps) {
  const isVideo = channel.type === 'video'

  return (
    <div>
      <div className="flex items-center gap-1 group">
        <motion.button
          whileHover={{ x: 2 }}
          onClick={onClick}
          className={cn(
            'flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-l-lg text-left transition-colors',
            isActive
              ? 'bg-discord-hover text-white'
              : 'text-discord-text-muted hover:bg-discord-hover hover:text-white',
          )}
        >
          {isVideo ? (
            <Video className="w-4 h-4 text-discord-text-dim" />
          ) : (
            <Volume2 className="w-4 h-4 text-discord-text-dim" />
          )}
          <span className="text-sm font-medium truncate flex-1 min-w-0">
            {channel.name}
          </span>
          <span className="text-xs text-discord-text-dim tabular-nums">
            {participantCount}
          </span>
          {isInRoom && (
            <span className="w-1.5 h-1.5 rounded-full bg-discord-green animate-pulse" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            onJoinToggle()
          }}
          title={isInRoom ? 'Desconectar' : `Entrar em ${isVideo ? 'vídeo' : 'voz'}`}
          className={cn(
            'h-7 w-7 rounded-r-lg flex items-center justify-center transition-colors',
            isInRoom
              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
              : 'opacity-0 group-hover:opacity-100 text-discord-text-dim hover:bg-discord-blurple/15 hover:text-discord-blurple',
          )}
        >
          {isInRoom ? <PhoneOff className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
        </motion.button>
      </div>

      {/* Lista de participantes conectados (estilo Discord) */}
      <AnimatePresence initial={false}>
        {participants && participants.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-7 pr-2 py-1 space-y-0.5">
              {participants.map((p) => (
                <ParticipantRow key={p.userId} p={p} selfId={selfId} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ParticipantRow({ p, selfId }: { p: Participant; selfId?: string }) {
  const isSelf = p.userId === selfId
  const isMuted = !!p.muted
  const isDeafened = !!p.deafened

  return (
    <div className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-discord-hover cursor-pointer group">
      <div className="relative shrink-0">
        <SpeakingAvatar userId={p.userId} src={p.avatarUrl} alt={p.displayName} size="xs" />
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center border-2 border-discord-surface',
            isMuted || isDeafened
              ? 'bg-red-500 text-white'
              : 'bg-discord-surface text-discord-green',
          )}
        >
          {isMuted || isDeafened ? (
            <MicOff className="w-1.5 h-1.5" />
          ) : (
            <Mic className="w-1.5 h-1.5" />
          )}
        </div>
      </div>
      <span
        className={cn(
          'text-xs truncate flex-1 min-w-0',
          isSelf
            ? 'font-semibold text-white'
            : 'text-discord-text-muted group-hover:text-white',
        )}
      >
        {p.displayName}
        {isSelf && <span className="ml-1 text-discord-text-dim">(você)</span>}
      </span>
      {isDeafened && (
        <Headphones className="w-3 h-3 text-red-400 shrink-0" />
      )}
    </div>
  )
}

interface TextChannelListItemProps {
  channel: Channel
  isActive: boolean
  onClick: () => void
}

export function TextChannelListItem({
  channel,
  isActive,
  onClick,
}: TextChannelListItemProps) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors',
        isActive
          ? 'bg-discord-hover text-white'
          : 'text-discord-text-muted hover:bg-discord-hover hover:text-white',
      )}
    >
      <Hash className="w-4 h-4 text-discord-text-dim" />
      <span className="text-sm font-medium truncate">{channel.name}</span>
      {isActive && (
        <motion.div
          layoutId="channelActive"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-discord-blurple"
        />
      )}
    </motion.button>
  )
}
