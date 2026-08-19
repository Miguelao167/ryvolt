'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import {
  VoiceChannelListItem,
  TextChannelListItem,
} from '@/components/voice/VoiceChannelListItem'
import { useVoiceStore } from '@/stores/voiceStore'
import { useVoiceConnection } from '@/hooks/useVoiceConnection'
import { useAuthStore } from '@/stores/authStore'
import { ServerHeaderMenu } from '@/components/community/ServerHeaderMenu'
import type { Channel, Community } from '@/types'
import type { Participant } from '@/lib/webrtc/types'

interface ConnectedChannelListProps {
  channels: Channel[]
  currentChannelId: string | null
  onSelectChannel: (channel: Channel) => void
  onCreateChannel: () => void
  communityName: string
  community?: Community | null
  isOwner?: boolean
  onOpenSettings?: () => void
  onCreateCategory?: () => void
  onCreateEvent?: () => void
  onHideMuted?: () => void
  onEditProfile?: () => void
  onLeaveCommunity?: () => void
  /** Element rendered at the bottom of the column (typically UserPanel) */
  footer?: React.ReactNode
}

export function ConnectedChannelList({
  channels,
  currentChannelId,
  onSelectChannel,
  onCreateChannel,
  communityName,
  community,
  isOwner,
  onOpenSettings,
  onCreateCategory,
  onCreateEvent,
  onHideMuted,
  onEditProfile,
  onLeaveCommunity,
  footer,
}: ConnectedChannelListProps) {
  const { joinVoice, leaveVoice, isInChannel } = useVoiceConnection()
  const participants = useVoiceStore((s) => s.participants)
  const activeChannelId = useVoiceStore((s) => s.activeChannelId)

  const [menuOpen, setMenuOpen] = useState(false)

  const grouped = groupChannels(channels)

  const activeParticipants = useMemo(
    () => (activeChannelId ? Array.from(participants.values()) : []),
    [activeChannelId, participants],
  )

  const selfId = useAuthStore((s) => s.user?.id)

  return (
    <div className="w-60 h-full bg-discord-surface flex flex-col">
      {/* Header - Discord style */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          onContextMenu={(e) => {
            e.preventDefault()
            setMenuOpen(true)
          }}
          className="w-full h-12 px-4 flex items-center justify-between hover:bg-discord-surface-2 transition-colors shadow-sm"
        >
          <h2 className="font-semibold text-white truncate">
            {communityName}
          </h2>
          <motion.div animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </button>

        {community && (
          <ServerHeaderMenu
            community={community}
            isOwner={!!isOwner}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onCreateChannel={onCreateChannel}
            onOpenSettings={onOpenSettings}
            onCreateCategory={onCreateCategory}
            onCreateEvent={onCreateEvent}
            onHideMuted={onHideMuted}
            onEditProfile={onEditProfile}
            onLeave={onLeaveCommunity}
          />
        )}
      </div>

      {/* Channel groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {grouped.map((group) => (
          <ChannelGroup
            key={group.category}
            category={group.category}
            channels={group.channels}
            currentChannelId={currentChannelId}
            onSelectChannel={onSelectChannel}
            isInChannel={isInChannel}
            activeChannelId={activeChannelId}
            activeParticipants={activeParticipants}
            selfId={selfId}
            onJoinToggle={async (channel) => {
              if (isInChannel(channel.id)) {
                leaveVoice()
              } else {
                await joinVoice(channel.id, { video: channel.type === 'video' })
                onSelectChannel(channel)
              }
            }}
          />
        ))}
      </div>

      {/* Footer (UserPanel + faixa de voz ativa) */}
      {footer && <div className="p-2">{footer}</div>}
    </div>
  )
}

interface ChannelGroupProps {
  category: string
  channels: Channel[]
  currentChannelId: string | null
  onSelectChannel: (channel: Channel) => void
  isInChannel: (id: string) => boolean
  activeChannelId: string | null
  activeParticipants: Participant[]
  selfId?: string
  onJoinToggle: (channel: Channel) => void
}

function ChannelGroup({
  category,
  channels,
  currentChannelId,
  onSelectChannel,
  isInChannel,
  activeChannelId,
  activeParticipants,
  selfId,
  onJoinToggle,
}: ChannelGroupProps) {
  const [open, setOpen] = useState(true)
  useEffect(() => setOpen(true), [])

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className="flex items-center gap-1 px-2 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-white cursor-pointer select-none"
      >
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="w-3 h-3" />
        </motion.div>
        {category}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden space-y-0.5"
          >
            {channels.map((channel) => {
              const isActive = currentChannelId === channel.id
              const isVoice = channel.type === 'voice' || channel.type === 'video'
              const isActiveVoice = channel.id === activeChannelId

              return isVoice ? (
                <VoiceChannelListItem
                  key={channel.id}
                  channel={channel}
                  isActive={isActive}
                  isInRoom={isInChannel(channel.id)}
                  participantCount={isActiveVoice ? activeParticipants.length : 0}
                  participants={isActiveVoice ? activeParticipants : undefined}
                  selfId={selfId}
                  onClick={() => onSelectChannel(channel)}
                  onJoinToggle={() => onJoinToggle(channel)}
                />
              ) : (
                <TextChannelListItem
                  key={channel.id}
                  channel={channel}
                  isActive={isActive}
                  onClick={() => onSelectChannel(channel)}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function groupChannels(channels: Channel[]) {
  const map = new Map<string, Channel[]>()
  for (const c of channels) {
    const cat = c.category || (c.type === 'text' ? 'TEXT CHANNELS' : 'VOICE CHANNELS')
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(c)
  }
  return Array.from(map.entries()).map(([category, channels]) => ({
    category,
    channels: channels.sort((a, b) => a.position - b.position),
  }))
}
