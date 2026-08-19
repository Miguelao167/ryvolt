'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  MessageCircle,
  X,
  Check,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, Input, Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui'
import {
  fetchFriends,
  fetchIncomingFriendRequests,
  fetchOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '@/lib/supabase/queries'
import type { User } from '@/types'

export type FriendsTab = 'online' | 'all' | 'pending'

export interface FriendEntry {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  status: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string | null
  // Discord-style extras
  activity?: {
    kind: 'call' | 'playing' | 'listening' | 'streaming'
    label: string
  } | null
  pendingIncoming?: boolean
  pendingOutgoing?: boolean
  hasUnread?: boolean
}

interface FriendsPageProps {
  currentUser: User
  onOpenDM: (otherUserId: string) => void
  onBack: () => void
}

const STATUS_LABEL: Record<FriendEntry['status'], string> = {
  online: 'Online',
  idle: 'Ausente',
  dnd: 'Não perturbar',
  offline: 'Offline',
}

export function FriendsPage({ currentUser, onOpenDM, onBack }: FriendsPageProps) {
  const [tab, setTab] = useState<FriendsTab>('online')
  const [search, setSearch] = useState('')
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const load = async () => {
    if (!currentUser?.id || currentUser.id === 'pending') return
    setLoading(true)
    try {
      const [accepted, incoming, outgoing] = await Promise.all([
        fetchFriends(currentUser.id),
        fetchIncomingFriendRequests(currentUser.id).catch(() => []),
        fetchOutgoingFriendRequests(currentUser.id).catch(() => []),
      ])

      const acceptedEntries: FriendEntry[] = (accepted ?? []).map((f) => ({
        id: f.id,
        username: f.username,
        displayName: f.displayName,
        avatarUrl: f.avatarUrl,
        status: (f.status as FriendEntry['status']) ?? 'offline',
        customStatus: null,
        activity: null,
      }))

      const incomingEntries: FriendEntry[] = (incoming ?? []).map((r: any) => ({
        id: r.user.id,
        username: r.user.username,
        displayName: r.user.displayName ?? r.user.display_name,
        avatarUrl: r.user.avatarUrl ?? r.user.avatar_url,
        status: (r.user.status as FriendEntry['status']) ?? 'offline',
        customStatus: null,
        activity: null,
        pendingIncoming: true,
      }))

      const outgoingEntries: FriendEntry[] = (outgoing ?? []).map((r: any) => ({
        id: r.user.id,
        username: r.user.username,
        displayName: r.user.displayName ?? r.user.display_name,
        avatarUrl: r.user.avatarUrl ?? r.user.avatar_url,
        status: (r.user.status as FriendEntry['status']) ?? 'offline',
        customStatus: null,
        activity: null,
        pendingOutgoing: true,
      }))

      setFriends([...acceptedEntries, ...incomingEntries, ...outgoingEntries])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  const filtered = useMemo(() => {
    let list: FriendEntry[] = []
    if (tab === 'online') {
      list = friends.filter((f) => f.status === 'online')
    } else if (tab === 'all') {
      list = friends.filter((f) => !f.pendingIncoming && !f.pendingOutgoing)
    } else {
      list = friends.filter((f) => f.pendingIncoming || f.pendingOutgoing)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((f) =>
        [f.username, f.displayName, f.customStatus ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    }
    return list
  }, [friends, tab, search])

  const onlineCount = friends.filter((f) => f.status === 'online' && !f.pendingIncoming && !f.pendingOutgoing).length
  const allCount = friends.filter((f) => !f.pendingIncoming && !f.pendingOutgoing).length
  const pendingCount = friends.filter((f) => f.pendingIncoming || f.pendingOutgoing).length

  const activeNow = useMemo(
    () => friends.filter((f) => f.status === 'online' && (f.activity || f.customStatus)).slice(0, 5),
    [friends]
  )

  return (
    <div className="flex-1 flex bg-discord-bg overflow-hidden">
      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 px-4 flex items-center justify-between border-b border-discord-deep shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="text-sm text-discord-text-dim hover:text-white transition-colors"
              title="Voltar"
            >
              ← Voltar
            </button>
            <h1 className="font-semibold text-white truncate flex items-center gap-2">
              <span className="text-lg">👥</span>
              Amigos
            </h1>

            <div className="flex items-center gap-1 ml-2">
              <TabButton active={tab === 'online'} onClick={() => setTab('online')}>
                Disponível
                {tab !== 'online' && onlineCount > 0 && (
                  <span className="ml-1.5 text-xs text-discord-text-dim">— {onlineCount}</span>
                )}
              </TabButton>
              <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
                Todos
                {tab !== 'all' && allCount > 0 && (
                  <span className="ml-1.5 text-xs text-discord-text-dim">— {allCount}</span>
                )}
              </TabButton>
              <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
                Pendente
                {tab !== 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 text-xs text-discord-text-dim">— {pendingCount}</span>
                )}
              </TabButton>
            </div>
          </div>

          <Button onClick={() => setShowAdd(true)} className="shrink-0">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Adicionar amigo
          </Button>
        </header>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-text-dim" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-discord-surface border border-discord-deep text-white placeholder:text-discord-text-dim focus:outline-none focus:border-discord-blurple"
            />
          </div>
        </div>

        {/* Section title */}
        <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-discord-text-dim shrink-0">
          {tab === 'pending' ? 'Solicitações' : 'Online'} —{' '}
          {tab === 'online' ? onlineCount : tab === 'all' ? allCount : pendingCount}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-discord-text-dim">
              Carregando…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="text-5xl mb-2">🫂</div>
              <h3 className="font-semibold text-white">
                {tab === 'pending'
                  ? 'Nenhuma solicitação pendente'
                  : tab === 'online'
                    ? 'Nenhum amigo online agora'
                    : 'Você ainda não tem amigos aqui'}
              </h3>
              <p className="text-sm text-discord-text-dim mt-1 max-w-sm mx-auto">
                {tab === 'pending'
                  ? 'Quando alguém te adicionar ou você enviar um pedido, aparece aqui.'
                  : 'Adicione amigos pelo botão acima pra começar.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((f) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  open={openMenuId === f.id}
                  onToggleMenu={() =>
                    setOpenMenuId((prev) => (prev === f.id ? null : f.id))
                  }
                  onCloseMenu={() => setOpenMenuId(null)}
                  onMessage={() => {
                    setOpenMenuId(null)
                    onOpenDM(f.id)
                  }}
                  onAccept={async () => {
                    await acceptFriendRequest(currentUser.id, f.id).catch(() => {})
                    await load()
                  }}
                  onDecline={async () => {
                    await declineFriendRequest(currentUser.id, f.id).catch(() => {})
                    await load()
                  }}
                  onRemove={async () => {
                    await removeFriend(currentUser.id, f.id).catch(() => {})
                    setOpenMenuId(null)
                    await load()
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right rail — Active now */}
      <aside className="w-72 shrink-0 border-l border-discord-deep bg-discord-surface hidden md:flex flex-col">
        <div className="h-14 px-4 flex items-center border-b border-discord-deep shrink-0">
          <h2 className="font-semibold text-white">Ativo agora</h2>
        </div>

        <div className="p-4">
          {activeNow.length === 0 ? (
            <div className="rounded-lg border border-dashed border-discord-deep p-4 text-center">
              <div className="text-2xl mb-1">💤</div>
              <p className="text-sm font-medium text-white">
                Por enquanto, está quieto…
              </p>
              <p className="text-xs text-discord-text-dim mt-1">
                Quando um(a) amigo(a) começar uma atividade, como jogar um jogo ou bater papo por
                voz, mostraremos aqui!
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {activeNow.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-sm">
                  <Avatar src={f.avatarUrl} alt={f.displayName} size="xs" status={f.status} />
                  <span className="text-white truncate">{f.displayName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <AddFriendModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={async (uname) => {
          await sendFriendRequest(currentUser.id, uname)
          await load()
        }}
      />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm rounded-md transition-colors',
        active
          ? 'bg-discord-hover text-white font-medium'
          : 'text-discord-text-muted hover:bg-discord-hover hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

function FriendRow({
  friend,
  open,
  onToggleMenu,
  onCloseMenu,
  onMessage,
  onAccept,
  onDecline,
  onRemove,
}: {
  friend: FriendEntry
  open: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onMessage: () => void
  onAccept: () => void
  onDecline: () => void
  onRemove: () => void
}) {
  const subtitle = friend.customStatus ?? STATUS_LABEL[friend.status]
  return (
    <li className="relative">
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
          'hover:bg-discord-hover'
        )}
      >
        <Avatar
          src={friend.avatarUrl}
          alt={friend.displayName}
          size="lg"
          status={friend.status}
          shape="circle"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-white truncate text-base">
              {friend.displayName}
            </span>
            {friend.activity?.kind === 'call' && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                📞 Em uma chamada
              </span>
            )}
          </div>
          <div
            className={cn(
              'text-xs truncate flex items-center gap-1.5 mt-0.5',
              friend.status === 'offline'
                ? 'text-discord-text-dim'
                : 'text-discord-text-muted'
            )}
          >
            {subtitle}
            {friend.status === 'online' && (
              <span className="w-1.5 h-1.5 rounded-full bg-discord-green shrink-0" />
            )}
            {friend.status === 'idle' && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
            )}
            {friend.status === 'dnd' && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex items-center gap-1 shrink-0 transition-opacity',
            'opacity-0 group-hover:opacity-100',
            open && 'opacity-100'
          )}
        >
          {friend.pendingIncoming ? (
            <>
              <button
                onClick={onAccept}
                className="p-2 rounded text-discord-text-dim hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Aceitar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onDecline}
                className="p-2 rounded text-discord-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Recusar"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : friend.pendingOutgoing ? (
            <span className="text-xs text-discord-text-dim pr-2">Pendente…</span>
          ) : (
            <>
              <button
                onClick={onMessage}
                className="p-2 rounded text-discord-text-dim hover:text-white hover:bg-discord-surface transition-colors"
                title="Mensagem"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={onToggleMenu}
                  className="p-2 rounded text-discord-text-dim hover:text-white hover:bg-discord-surface transition-colors"
                  title="Mais"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {open && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-discord-deep bg-discord-surface shadow-xl z-10 py-1"
                    onMouseLeave={onCloseMenu}
                  >
                    <button
                      onClick={onMessage}
                      className="w-full px-3 py-2 text-left text-sm text-discord-text-muted hover:bg-discord-hover"
                    >
                      Mensagem
                    </button>
                    <button
                      onClick={() => alert('Chamada em breve')}
                      className="w-full px-3 py-2 text-left text-sm text-discord-text-muted hover:bg-discord-hover flex items-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Ligar
                    </button>
                    <div className="my-1 border-t border-discord-deep" />
                    <button
                      onClick={onRemove}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                    >
                      Remover amigo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

function AddFriendModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (username: string) => Promise<void>
}) {
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!username.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(username.trim())
      setSent(true)
      setUsername('')
      setTimeout(() => {
        setSent(false)
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao enviar pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Adicionar amigo</ModalTitle>
        </ModalHeader>
        <div className="space-y-3">
          <Input
            label="Nome de usuário"
            placeholder="usuario_legal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}
          {sent && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">
              Pedido enviado!
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!username.trim() || submitting}>
            {submitting ? 'Enviando…' : 'Enviar pedido'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}