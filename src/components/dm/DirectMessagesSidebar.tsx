'use client'

import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { SpeakingAvatar } from '@/components/voice/SpeakingAvatar'
import type { User } from '@/types'
import type { DMThread } from '@/lib/supabase/queries'

interface DirectMessagesSidebarProps {
  threads: DMThread[]
  users: Record<string, User>
  currentUserId: string
  activeThreadId: string | null
  onSelectThread: (threadId: string) => void
  onCreateDM: () => void
  onOpenFriends?: () => void
  onOpenNitro?: () => void
  activeNavId?: string
  footer?: React.ReactNode
}

const NAV_ITEMS: { id: string; label: string; icon: string; badge?: string }[] = [
  { id: 'friends', label: 'Amigos', icon: '👥' },
  { id: 'nitro', label: 'Nitro', icon: '✨', badge: 'NOVO' },
  { id: 'shop', label: 'Loja', icon: '🛍️', badge: 'NOVO' },
  { id: 'quests', label: 'Missões', icon: '🏆' },
]

export function DirectMessagesSidebar({
  threads,
  users,
  currentUserId,
  activeThreadId,
  onSelectThread,
  onCreateDM,
  onOpenFriends,
  onOpenNitro,
  activeNavId,
  footer,
}: DirectMessagesSidebarProps) {
  const [search, setSearch] = useState('')

  const filteredThreads = threads.filter((t) => {
    if (!search.trim()) return true
    const otherId = t.participants.find((p) => p !== currentUserId)
    const other = otherId ? users[otherId] : null
    const name = other?.displayName ?? other?.username ?? ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <aside className="w-60 h-full bg-discord-surface flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between shadow-sm shrink-0">
        <h2 className="font-semibold text-white">Mensagens diretas</h2>
        <button
          onClick={onCreateDM}
          className="p-1.5 rounded hover:bg-discord-hover text-gray-400 hover:text-white transition-colors"
          title="Nova mensagem"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ou começar uma conversa"
            className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md bg-discord-deep text-white placeholder:text-gray-400 focus:outline-none border border-transparent focus:border-discord-blurple transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {/* Top nav */}
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isFriends = item.id === 'friends'
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isFriends) onOpenFriends?.()
                  if (item.id === 'nitro') onOpenNitro?.()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-colors',
                  activeNavId === item.id
                    ? 'bg-discord-hover text-white'
                    : 'text-gray-300 hover:bg-discord-hover hover:text-white'
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-discord-blurple text-white uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* DMs list */}
        <div>
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Mensagens diretas
          </div>
          <div className="space-y-0.5">
            {filteredThreads.length === 0 && (
              <div className="px-3 py-6 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ryvolt-logo.png"
                  alt=""
                  className="w-10 h-10 mx-auto mb-2 rounded-lg object-contain"
                />
                <p className="text-xs text-gray-400">
                  {search.trim() ? 'Nenhuma conversa' : 'Nenhuma DM ainda'}
                </p>
              </div>
            )}
            {filteredThreads.map((t) => {
              const otherId = t.participants.find((p) => p !== currentUserId)
              const other = otherId ? users[otherId] : null
              const name = other?.displayName ?? other?.username ?? 'Conversa'
              const isActive = activeThreadId === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectThread(t.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors text-left',
                    isActive
                      ? 'bg-discord-hover text-white'
                      : 'text-gray-300 hover:bg-discord-hover hover:text-white',
                  )}
                >
                  <SpeakingAvatar
                    userId={other?.id}
                    src={other?.avatarUrl}
                    alt={name}
                    size="md"
                    status={other?.status}
                    shape="circle"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold text-white">
                      {name}
                    </div>
                    {t.lastMessage ? (
                      <div className="text-xs text-gray-400 truncate mt-0.5">
                        {t.lastMessage.content}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 truncate mt-0.5 italic">
                        Nenhuma mensagem ainda
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {footer && (
        <div className="p-2 shrink-0">
          {footer}
        </div>
      )}
    </aside>
  )
}
