'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, MessageCircle, MoreHorizontal, Phone, Video, UserPlus, UserMinus, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '@/lib/supabase/queries'
import type { User } from '@/types'

interface UserProfilePageProps {
  currentUser: User
  targetUserId: string
  onClose: () => void
  onOpenDM?: (otherUserId: string) => void
}

type Relationship = 'self' | 'friend' | 'incoming' | 'outgoing' | 'none'

export function UserProfilePage({ currentUser, targetUserId, onClose, onOpenDM }: UserProfilePageProps) {
  const [target, setTarget] = useState<User | null>(null)
  const [relationship, setRelationship] = useState<Relationship>('none')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (targetUserId === currentUser.id) {
      setTarget(currentUser)
      setRelationship('self')
      setLoading(false)
      return
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId])

  const load = async () => {
    setLoading(true)
    const sb = createClient()
    const { data: row } = await sb.from('users').select('*').eq('id', targetUserId).maybeSingle()
    if (!row) {
      setLoading(false)
      return
    }
    setTarget({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      email: row.email ?? '',
      avatarUrl: row.avatar_url,
      bannerUrl: row.banner_url,
      customStatus: row.custom_status,
      bio: row.bio ?? null,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at ?? row.created_at),
    })

    const { data: fr } = await sb
      .from('friendships')
      .select('*')
      .or(
        `and(user_id.eq.${currentUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUser.id})`
      )
      .maybeSingle()
    if (!fr) {
      setRelationship('none')
    } else if (fr.status === 'accepted') {
      setRelationship('friend')
    } else if (fr.status === 'pending' && fr.user_id === targetUserId) {
      setRelationship('incoming')
    } else if (fr.status === 'pending' && fr.user_id === currentUser.id) {
      setRelationship('outgoing')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-discord-bg flex items-center justify-center">
        <div className="text-sm text-discord-text-dim">Carregando…</div>
      </div>
    )
  }

  if (!target) {
    return (
      <div className="fixed inset-0 z-50 bg-discord-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-discord-text-dim">Usuário não encontrado.</p>
          <Button className="mt-4" onClick={onClose}>Voltar</Button>
        </div>
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    online: 'Online',
    idle: 'Ausente',
    dnd: 'Não perturbe',
    offline: 'Offline',
  }

  return (
    <div className="fixed inset-0 z-50 bg-discord-bg overflow-y-auto">
      {/* Top bar */}
      <header className="h-14 px-4 flex items-center border-b border-discord-deep sticky top-0 bg-discord-bg/85 backdrop-blur z-10">
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-discord-hover text-discord-text-dim hover:text-white mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-white">{target.displayName}</span>
      </header>

      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-violet-500/30 to-cyan-500/30">
        {target.bannerUrl && (
          <img src={target.bannerUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 -mt-16 relative">
        <div className="flex items-end justify-between">
          <Avatar src={target.avatarUrl} alt={target.displayName} size="2xl" status={target.status} />
          <div className="flex items-center gap-2 mb-3">
            {relationship === 'self' ? null : relationship === 'friend' ? (
              <>
                <Button onClick={() => onOpenDM?.(target.id)}>
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Mensagem
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await removeFriend(currentUser.id, target.id)
                    setRelationship('none')
                  }}
                >
                  <UserMinus className="w-4 h-4 mr-1.5" />
                  Remover amigo
                </Button>
              </>
            ) : relationship === 'incoming' ? (
              <>
                <Button
                  onClick={async () => {
                    await acceptFriendRequest(currentUser.id, target.id)
                    setRelationship('friend')
                  }}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Aceitar
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await declineFriendRequest(currentUser.id, target.id)
                    setRelationship('none')
                  }}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Recusar
                </Button>
              </>
            ) : relationship === 'outgoing' ? (
              <Button variant="secondary" disabled>Pendente…</Button>
            ) : (
              <Button
                onClick={async () => {
                  await sendFriendRequest(currentUser.id, target.username)
                  setRelationship('outgoing')
                }}
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Adicionar amigo
              </Button>
            )}
          </div>
        </div>

        {/* Name + meta */}
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-white">{target.displayName}</h1>
          <div className="text-sm text-discord-text-dim">@{target.username}</div>
          {target.customStatus && (
            <div className="mt-2 text-sm text-discord-text-muted">{target.customStatus}</div>
          )}
          <div className="mt-1 text-xs text-discord-text-dim">
            {statusLabel[target.status] ?? 'Offline'}
          </div>
        </div>

        {/* Bio */}
        {target.bio && (
          <div className="mt-6 rounded-lg border border-discord-deep bg-discord-surface p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-discord-text-dim mb-2">
              Sobre
            </div>
            <p className="text-sm text-white whitespace-pre-wrap">{target.bio}</p>
          </div>
        )}

        {/* Note */}
        <div className="mt-8 text-xs text-discord-text-dim">
          Membro desde {target.createdAt.toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  )
}