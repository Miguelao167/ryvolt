'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Settings, Hash, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Channel, ChannelType } from '@/types'

interface ChannelListProps {
  channels: Channel[]
  currentChannelId?: string
  onSelectChannel: (channel: Channel) => void
  onCreateChannel: () => void
  communityName: string
}

export function ChannelList({
  channels,
  currentChannelId,
  onSelectChannel,
  onCreateChannel,
  communityName,
}: ChannelListProps) {
  // Group channels by category
  const categories = channels.reduce((acc, channel) => {
    const category = channel.category || 'Channels'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(channel)
    return acc
  }, {} as Record<string, Channel[]>)

  return (
    <div className="w-60 h-full bg-discord-surface flex flex-col border-r border-discord-deep">
      {/* Header */}
      <ChannelListHeader communityName={communityName} />

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {Object.entries(categories).map(([category, categoryChannels]) => (
          <ChannelCategory
            key={category}
            name={category}
            channels={categoryChannels}
            currentChannelId={currentChannelId}
            onSelectChannel={onSelectChannel}
            onCreateChannel={onCreateChannel}
          />
        ))}
      </div>
    </div>
  )
}

function ChannelListHeader({ communityName }: { communityName: string }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-discord-deep shrink-0">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-white font-semibold hover:opacity-80 transition-opacity"
      >
        <span>{communityName}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-discord-text-dim transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </motion.button>
      <button className="p-1 rounded hover:bg-discord-hover text-discord-text-muted hover:text-white transition-colors">
        <Settings className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ChannelCategoryProps {
  name: string
  channels: Channel[]
  currentChannelId?: string
  onSelectChannel: (channel: Channel) => void
  onCreateChannel: () => void
}

function ChannelCategory({
  name,
  channels,
  currentChannelId,
  onSelectChannel,
  onCreateChannel,
}: ChannelCategoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isVoiceCategory = channels[0]?.type === 'voice'

  return (
    <div className="mb-4">
      <div className="px-2 mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-discord-text-dim hover:text-discord-text-muted transition-colors"
        >
          <ChevronDown
            className={cn(
              'w-3 h-3 transition-transform',
              isCollapsed && '-rotate-90'
            )}
          />
          {name}
        </button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-0.5"
          >
            {channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === currentChannelId}
                onClick={() => onSelectChannel(channel)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ChannelItemProps {
  channel: Channel
  isActive: boolean
  onClick: () => void
}

function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  const isVoice = channel.type === 'voice'

  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors',
        isActive
          ? 'bg-discord-hover text-white'
          : 'text-discord-text-muted hover:bg-discord-hover hover:text-white'
      )}
    >
      {isVoice ? (
        <Volume2 className="w-4 h-4 text-discord-text-dim" />
      ) : (
        <Hash className="w-4 h-4 text-discord-text-dim" />
      )}
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
