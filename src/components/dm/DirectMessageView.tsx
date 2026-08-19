'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Phone,
  Video,
  Search,
  Inbox,
  Plus,
  AtSign,
  Smile,
  Gift,
  Sticker,
  Mic,
  Settings,
  UserX,
  Pin,
  X as XIcon,
  PhoneOff,
  VideoOff,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, Markdown } from '@/components/ui'
import { VoiceCallView } from '@/components/voice'
import { useVoiceStore } from '@/stores/voiceStore'
import { useDMCall } from '@/hooks/useDMCall'
import {
  fetchDMMessages,
  sendDM,
  type DMMessage,
} from '@/lib/supabase/queries'
import type { User } from '@/types'

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDayLabel(d: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface DirectMessageViewProps {
  threadId: string
  currentUser: User
  otherUser: User | null
}

export function DirectMessageView({ threadId, currentUser, otherUser }: DirectMessageViewProps) {
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { startCall, endCall } = useDMCall()
  const activeDMThreadId = useVoiceStore((s) => s.activeDMThreadId)
  const connectionState = useVoiceStore((s) => s.connectionState)
  const isInThisCall = activeDMThreadId === threadId

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const msgs = await fetchDMMessages(threadId).catch(() => [])
      if (!cancelled) {
        setMessages(msgs)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [threadId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!draft.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      const sent = await sendDM(threadId, currentUser.id, draft)
      setMessages((prev) => [...prev, sent])
      setDraft('')
    } catch (err: any) {
      console.error('[DM] send failed:', err)
      setError(err?.message ?? 'Falha ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const headerName = otherUser?.displayName ?? otherUser?.username ?? 'Conversa'
  const headerUsername = otherUser?.username ?? ''
  const isEmpty = !loading && messages.length === 0

  // Agrupa mensagens por dia
  const grouped: Array<{ day: string; items: DMMessage[] }> = []
  for (const m of messages) {
    const label = formatDayLabel(m.createdAt)
    const last = grouped[grouped.length - 1]
    if (last && last.day === label) last.items.push(m)
    else grouped.push({ day: label, items: m })
  }

  // Render the voice/video call interface when this DM is in a call
  if (isInThisCall) {
    return (
      <VoiceCallView
        dmThreadId={threadId}
        callName={headerName}
        showVideo={false}
      />
    )
  }

  return (
    <div className="flex-1 flex min-w-0 bg-discord-bg">
      {/* Conversation column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — Discord style */}
        <header className="h-14 px-4 flex items-center justify-between border-b border-discord-deep shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={otherUser?.avatarUrl}
              alt={headerName}
              size="sm"
              status={otherUser?.status}
              shape="circle"
            />
            <div className="min-w-0">
              <div className="font-semibold text-white truncate">
                {headerName}
              </div>
              <div className="text-xs text-discord-text-dim truncate">
                {headerUsername ? `@${headerUsername}` : ' '}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={async () => {
                if (!otherUser) return
                await startCall({ threadId, otherUser, withVideo: false })
              }}
              className="p-2 rounded hover:bg-discord-hover text-discord-text-dim hover:text-white"
              title="Iniciar chamada de voz"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                if (!otherUser) return
                await startCall({ threadId, otherUser, withVideo: true })
              }}
              className="p-2 rounded hover:bg-discord-hover text-discord-text-dim hover:text-white"
              title="Iniciar chamada de vídeo"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPinned((s) => !s)}
              className={cn(
                'p-2 rounded hover:bg-discord-hover text-discord-text-dim hover:text-white',
                showPinned && 'text-white bg-discord-hover'
              )}
              title="Mensagens fixadas"
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowSearch((s) => !s)
                if (!showSearch) setTimeout(() => searchRef.current?.focus(), 50)
              }}
              className={cn(
                'p-2 rounded hover:bg-discord-hover text-discord-text-dim hover:text-white',
                showSearch && 'text-white bg-discord-hover'
              )}
              title="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowProfile((s) => !s)}
              className={cn(
                'p-2 rounded hover:bg-discord-hover text-discord-text-dim hover:text-white',
                showProfile && 'text-white'
              )}
              title="Mostrar perfil"
            >
              <AtSign className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Search bar (toggles) */}
        {showSearch && (
          <div className="px-4 py-2 border-b border-discord-deep bg-discord-bg">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-discord-text-dim shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-discord-text-dim outline-none"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 rounded hover:bg-discord-hover text-discord-text-dim"
                title="Fechar"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Pinned messages banner */}
        {showPinned && (
          <div className="px-4 py-2 border-b border-discord-deep bg-discord-bg">
            <div className="text-xs text-discord-text-dim">
              Nenhuma mensagem fixada ainda.
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-sm text-discord-text-dim py-8">Carregando...</div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <Avatar
                src={otherUser?.avatarUrl}
                alt={headerName}
                size="2xl"
                shape="circle"
              />
              <h2 className="mt-5 text-2xl font-bold text-white">
                {headerName}
              </h2>
              <p className="text-discord-text-dim mt-1">
                {headerUsername ? `@${headerUsername}` : ''}
              </p>
              <p className="text-sm text-discord-text-muted mt-5 max-w-md">
                Este é o começo do seu histórico de mensagens diretas com{' '}
                <span className="font-semibold text-white">{headerName}</span>.
              </p>
              <div className="mt-5 flex items-center gap-3 text-xs text-discord-text-dim">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-discord-green" />
                  Online agora
                </span>
              </div>
              <Button
                className="mt-6"
                onClick={async () => {
                  if (!otherUser) return
                  await startCall({ threadId, otherUser, withVideo: false })
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Ligar para {headerName}
              </Button>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-6">
              {grouped.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-discord-text-dim">
                    <span className="flex-1 h-px bg-discord-deep" />
                    <span>{group.day}</span>
                    <span className="flex-1 h-px bg-discord-deep" />
                  </div>
                  {group.items.map((m, idx) => {
                    const mine = m.senderId === currentUser.id
                    const prev = group.items[idx - 1]
                    const isFirstInGroup = !prev || prev.senderId !== m.senderId
                    return (
                      <div key={m.id} className="flex gap-3 group">
                        <div className="w-9 shrink-0">
                          {isFirstInGroup ? (
                            <Avatar
                              src={mine ? currentUser.avatarUrl : otherUser?.avatarUrl}
                              alt={mine ? currentUser.displayName : headerName}
                              size="sm"
                              shape="circle"
                            />
                          ) : (
                            <div className="text-[10px] text-discord-text-dim text-center pt-1 opacity-0 group-hover:opacity-100">
                              {formatDateTime(m.createdAt)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isFirstInGroup && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-white">
                                {mine ? currentUser.displayName : headerName}
                              </span>
                              <span className="text-[10px] text-discord-text-dim">
                                {formatDateTime(m.createdAt)}
                              </span>
                            </div>
                          )}
                          <Markdown className="mt-0.5">{m.content}</Markdown>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-4 pt-2 pb-4 shrink-0">
          {error && (
            <div className="mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <span>⚠️ {error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 shrink-0"
                title="Fechar"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 bg-discord-surface rounded-xl px-3 py-2 border border-discord-deep focus-within:border-discord-blurple">
            <button
              className="p-1.5 rounded hover:bg-discord-hover text-discord-text-dim"
              title="Enviar arquivo"
            >
              <Plus className="w-5 h-5" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Conversar em @${otherUser?.username ?? '...'}`}
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm text-white placeholder:text-discord-text-dim focus:outline-none max-h-32 py-1.5"
            />
            <button
              className="p-1.5 rounded hover:bg-discord-hover text-discord-text-dim"
              title="Gift"
            >
              <Gift className="w-5 h-5" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-discord-hover text-discord-text-dim"
              title="GIF"
            >
              <span className="text-xs font-bold">GIF</span>
            </button>
            <button
              className="p-1.5 rounded hover:bg-discord-hover text-discord-text-dim"
              title="Sticker"
            >
              <Sticker className="w-5 h-5" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-discord-hover text-discord-text-dim"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right rail — Perfil do amigo (estilo Discord) */}
      {showProfile && otherUser && (
        <aside className="w-72 shrink-0 border-l border-discord-deep bg-discord-surface hidden lg:flex flex-col overflow-y-auto">
          <div className="h-20 bg-gradient-to-br from-violet-500/40 to-cyan-500/40 shrink-0" />
          <div className="px-4 -mt-10 shrink-0">
            <div className="w-20 h-20 rounded-full border-[6px] border-discord-surface overflow-hidden bg-discord-surface">
              <Avatar
                src={otherUser.avatarUrl}
                alt={headerName}
                size="2xl"
                shape="circle"
                className="!w-full !h-full"
              />
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">
              {headerName}
            </h2>
            <p className="text-sm text-discord-text-dim">
              {headerUsername ? `${headerUsername}` : ''}
            </p>
            <div className="mt-3 text-xs text-discord-text-dim flex items-center gap-2">
              <span>👥 0 amigos mútuos</span>
              <span>•</span>
              <span>🏠 0 servidores mútuos</span>
            </div>
          </div>

          {/* Quick call buttons (Discord style) */}
          <div className="px-4 pt-5 grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                if (!otherUser) return
                await startCall({ threadId, otherUser, withVideo: false })
              }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-discord-hover hover:bg-discord-surface2 text-white text-sm font-medium transition-colors"
            >
              <Phone className="w-4 h-4" />
              Ligar
            </button>
            <button
              onClick={async () => {
                if (!otherUser) return
                await startCall({ threadId, otherUser, withVideo: true })
              }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-discord-hover hover:bg-discord-surface2 text-white text-sm font-medium transition-colors"
            >
              <Video className="w-4 h-4" />
              Vídeo
            </button>
          </div>

          <div className="border-t border-discord-deep mt-5 pt-4 px-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-discord-text-dim">
              Membro desde
            </h3>
            <p className="text-sm text-white mt-1">
              {otherUser.createdAt
                ? otherUser.createdAt.toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>

          <div className="border-t border-discord-deep mt-4 pt-4 px-4 pb-4 space-y-2">
            <button className="w-full flex items-center justify-between px-2 py-2 rounded text-sm text-discord-text-muted hover:bg-discord-hover hover:text-white transition-colors">
              <span>Silenciar</span>
              <span className="w-9 h-5 rounded-full bg-discord-hover relative">
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-discord-text-dim" />
              </span>
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <UserX className="w-4 h-4" />
              Bloquear
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
