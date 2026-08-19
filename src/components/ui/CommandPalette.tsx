'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Search,
  Hash,
  Users,
  MessageSquare,
  X,
  CornerDownLeft,
  User,
  Server,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchMessages } from '@/lib/supabase/queries'
import type { Channel, Community } from '@/types'

interface SearchResult {
  id: string
  type: 'message' | 'channel' | 'community'
  title: string
  subtitle?: string
  icon?: React.ReactNode
  onClick: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  /** Canal selecionado pra buscar mensagens */
  currentChannelId?: string
  /** Canal atual */
  currentChannel?: Channel | null
  /** Comunidade atual */
  currentCommunity?: Community | null
  /** Ao selecionar canal */
  onNavigateChannel?: (channelId: string) => void
  /** Ao selecionar comunidade */
  onNavigateCommunity?: (communityId: string) => void
  /** Ao selecionar mensagem (scroll até ela) */
  onNavigateMessage?: (messageId: string, channelId: string) => void
  /** Canais da comunidade atual */
  channels?: Channel[]
  /** Comunidades do usuário */
  communities?: Community[]
  /** Mensagens do canal atual (busca local) */
  localMessages?: { id: string; channelId: string; content: string; authorName?: string }[]
}

const RECENT_KEY = 'ryvolt_cmd_recent'

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecent(ids: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 5))) } catch {}
}

export function CommandPalette({
  open,
  onClose,
  currentChannelId,
  currentChannel,
  currentCommunity,
  onNavigateChannel,
  onNavigateCommunity,
  onNavigateMessage,
  channels = [],
  communities = [],
  localMessages = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Parent decides open/close — just dispatch event
        window.dispatchEvent(new CustomEvent('ryvolt:cmd-toggle'))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const q = query.toLowerCase()
    const timer = setTimeout(async () => {
      setLoading(true)
      const found: SearchResult[] = []

      // Canais locais
      channels
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((ch) => {
          found.push({
            id: ch.id,
            type: 'channel',
            title: `# ${ch.name}`,
            subtitle: ch.category ? `em ${ch.category}` : currentCommunity?.name,
            icon: <Hash className="w-4 h-4 text-discord-text-dim" />,
            onClick: () => {
              onNavigateChannel?.(ch.id)
              saveRecent([...getRecent(), `ch-${ch.id}`].slice(-5))
              onClose()
            },
          })
        })

      // Comunidades locais
      communities
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((comm) => {
          found.push({
            id: comm.id,
            type: 'community',
            title: comm.name,
            subtitle: comm.description || undefined,
            icon: <Server className="w-4 h-4 text-discord-text-dim" />,
            onClick: () => {
              onNavigateCommunity?.(comm.id)
              saveRecent([...getRecent(), `comm-${comm.id}`].slice(-5))
              onClose()
            },
          })
        })

      // Mensagens do canal atual (local)
      if (currentChannelId && localMessages.length > 0) {
        localMessages
          .filter((m) => m.content.toLowerCase().includes(q))
          .slice(0, 8)
          .forEach((m) => {
            found.push({
              id: m.id,
              type: 'message',
              title: m.content.slice(0, 80) + (m.content.length > 80 ? '…' : ''),
              subtitle: `${m.authorName || 'Você'} · em #${currentChannel?.name || currentChannelId}`,
              onClick: () => {
                onNavigateMessage?.(m.id, currentChannelId)
                onClose()
              },
            })
          })
      }

      // Se query maior, busca no Supabase também
      if (q.length >= 3 && currentChannelId) {
        try {
          const remote = await searchMessages(q, currentChannelId, 5)
          remote.forEach((m) => {
            if (!found.some((r) => r.id === m.id)) {
              found.push({
                id: m.id,
                type: 'message',
                title: m.content.slice(0, 80) + (m.content.length > 80 ? '…' : ''),
                subtitle: `${m.authorName || 'Usuário'} · em #${currentChannel?.name || 'canal'}`,
                onClick: () => {
                  onNavigateMessage?.(m.id, currentChannelId)
                  onClose()
                },
              })
            }
          })
        } catch { /* silent */ }
      }

      setResults(found)
      setActiveIndex(0)
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, channels, communities, currentChannelId, currentChannel, localMessages, onNavigateChannel, onNavigateCommunity, onNavigateMessage, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[activeIndex]) { e.preventDefault(); results[activeIndex].onClick() }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 bg-discord-surface rounded-xl border border-discord-deep shadow-2xl overflow-hidden"
        style={{ maxHeight: '70vh' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-discord-deep">
          <Search className="w-5 h-5 text-discord-text-dim shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar em mensagens, canais e servidores…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-discord-text-dim outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-discord-text-dim hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-discord-surface border border-discord-deep text-discord-text-dim">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 56px)' }}>
          {!query && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="w-10 h-10 text-discord-text-dim mb-3 opacity-30" />
              <p className="text-sm text-discord-text-dim">
                Comece a digitar para buscar
              </p>
              <p className="text-xs text-discord-text-dim mt-1 opacity-60">
                Mensagens · Canais · Servidores
              </p>
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquare className="w-10 h-10 text-discord-text-dim mb-3 opacity-30" />
              <p className="text-sm text-discord-text-dim">
                Nenhum resultado para "{query}"
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-1">
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}`}
                  data-idx={i}
                  onClick={r.onClick}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    i === activeIndex
                      ? 'bg-discord-hover'
                      : 'hover:bg-discord-hover/50'
                  )}
                >
                  {r.icon || (
                    <MessageSquare className="w-4 h-4 text-discord-text-dim shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate font-medium">
                      {r.title}
                    </div>
                    {r.subtitle && (
                      <div className="text-xs text-discord-text-dim truncate mt-0.5">
                        {r.subtitle}
                      </div>
                    )}
                  </div>
                  {i === activeIndex && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-discord-text-dim shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="py-6 text-center text-sm text-discord-text-dim">
              Buscando…
            </div>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-discord-deep text-[10px] text-discord-text-dim">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-discord-surface border border-discord-deep">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-discord-surface border border-discord-deep">↵</kbd>
              selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-discord-surface border border-discord-deep">ESC</kbd>
              fechar
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
