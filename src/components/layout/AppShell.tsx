'use client'

import { useState, useEffect } from 'react'
import { Sidebar, ChatArea, UserList } from '@/components/layout'
import { ConnectedChannelList } from './ConnectedChannelList'
import { UserPanel } from './UserPanel'
import type { Message } from '@/types'
import { DirectMessagesSidebar } from '@/components/dm/DirectMessagesSidebar'
import { DirectMessageView } from '@/components/dm/DirectMessageView'
import { FriendsPage } from '@/components/dm/FriendsPage'
import { NitroPage } from '@/components/dm/NitroPage'
import { UserSettingsPage } from '@/components/user/UserSettingsPage'
import type { UserSettingsTab } from '@/components/user/UserSettingsPage'
import { UserProfilePage } from '@/components/user/UserProfilePage'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { CreateChannelModal } from '@/components/community/CreateChannelModal'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  Button,
  Input,
  Textarea,
  TooltipProvider,
  Avatar,
} from '@/components/ui'
import { useCommunityStore, useChatStore, useAuthStore } from '@/stores'
import { VoiceChannelView } from '@/components/voice/VoiceChannelView'
import { usePresence } from '@/hooks/usePresence'
import {
  fetchDMThreads,
  createOrFindDMThread,
  type DMThread,
} from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import type { Community, Channel, User } from '@/types'

// Fallback user while the real one is being hydrated
const fallbackUser: User = {
  id: 'pending',
  email: '',
  username: 'guest',
  displayName: 'Guest',
  avatarUrl: null,
  bannerUrl: null,
  bio: null,
  status: 'offline',
  customStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export function AppShell() {
  const storeUser = useAuthStore((s) => s.user)
  const currentUser: User = storeUser ?? fallbackUser

  // Sincroniza status online/offline com presença real
  usePresence()

  // Community store
  const communities = useCommunityStore((s) => s.communities)
  const channels = useCommunityStore((s) => s.channels)
  const currentCommunity = useCommunityStore((s) => s.currentCommunity)
  const currentChannel = useCommunityStore((s) => s.currentChannel)
  const members = useCommunityStore((s) => s.members)
  const loadForUser = useCommunityStore((s) => s.loadForUser)
  const loadMembers = useCommunityStore((s) => s.loadMembers)
  const setCurrentCommunity = useCommunityStore((s) => s.setCurrentCommunity)
  const setCurrentChannel = useCommunityStore((s) => s.setCurrentChannel)
  const removeCommunity = useCommunityStore((s) => s.removeCommunity)
  const createChannelAction = useCommunityStore((s) => s.createChannelAction)

  // Chat store
  const messages = useChatStore((s) => s.messages)
  const loadForChannel = useChatStore((s) => s.loadForChannel)
  const sendMessageAction = useChatStore((s) => s.send)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [createChannelCategory, setCreateChannelCategory] = useState<string | null>(null)
  const [mode, setMode] = useState<'community' | 'dm' | 'friends' | 'nitro' | 'user-settings' | 'user-profile'>('community')
  const [userSettingsTab, setUserSettingsTab] = useState<UserSettingsTab>('account')
  const [profileTargetId, setProfileTargetId] = useState<string | null>(null)
  const [dmThreads, setDmThreads] = useState<DMThread[]>([])
  const [dmUsers, setDmUsers] = useState<Record<string, User>>({})
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [showCommand, setShowCommand] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  // Ctrl+K / Command Palette toggle
  useEffect(() => {
    const handler = () => setShowCommand((v) => !v)
    window.addEventListener('ryvolt:cmd-toggle', handler)
    return () => window.removeEventListener('ryvolt:cmd-toggle', handler)
  }, [])

  // Load communities + channels when user becomes available
  useEffect(() => {
    if (storeUser?.id && storeUser.id !== 'pending') {
      void loadForUser(storeUser.id)
    }
  }, [storeUser?.id, loadForUser])

  // Load members when community changes
  useEffect(() => {
    if (currentCommunity) {
      void loadMembers(currentCommunity.id)
    }
  }, [currentCommunity?.id, loadMembers])

  // Load messages when channel changes
  useEffect(() => {
    if (currentChannel) {
      void loadForChannel(currentChannel.id)
    }
  }, [currentChannel?.id, loadForChannel])

  const handleSendMessage = async (content: string) => {
    if (!currentChannel || !storeUser?.id) return
    await sendMessageAction(currentChannel.id, storeUser.id, content)
  }

  const handleLogout = async () => {
    const signOut = useAuthStore.getState().signOut
    await signOut()
    window.location.href = '/'
  }

  const handleSelectCommunity = (c: Community | null) => {
    setMode('community')
    setCurrentCommunity(c)
    if (c) {
      const first = channels.find((ch) => ch.communityId === c.id)
      setCurrentChannel(first ?? null)
    } else {
      setCurrentChannel(null)
    }
  }

  const openDM = async () => {
    setMode('dm')
    if (!storeUser?.id || storeUser.id === 'pending') return
    const threads = await fetchDMThreads(storeUser.id).catch(() => [])
    setDmThreads(threads)
    const allIds = Array.from(new Set(threads.flatMap((t) => t.participants)))
    const sb = createClient()
    if (allIds.length > 0) {
      const { data: rows } = await sb.from('users').select('*').in('id', allIds)
      const map: Record<string, User> = {}
      for (const r of rows ?? []) {
        map[r.id] = {
          id: r.id,
          username: r.username,
          displayName: r.display_name,
          email: r.email ?? '',
          avatarUrl: r.avatar_url,
          bannerUrl: null,
          customStatus: null,
          bio: r.bio ?? null,
          status: r.status,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at ?? r.created_at),
        }
      }
      setDmUsers(map)
    }
  }

  const handleCreateDM = async () => {
    if (!storeUser?.id || storeUser.id === 'pending') return
    const username = prompt('Nome de usuário pra abrir DM:')
    if (!username) return
    const sb = createClient()
    const { data: target } = await sb.from('users').select('id').eq('username', username).maybeSingle()
    if (!target) {
      alert('Usuário não encontrado')
      return
    }
    try {
      const thread = await createOrFindDMThread(storeUser.id, target.id)
      setActiveThreadId(thread.id)
      await openDM()
    } catch (err: any) {
      alert(err?.message ?? 'Falha ao criar DM')
    }
  }

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId)
  }

  const openFriends = () => {
    setMode('friends')
  }

  const openNitro = () => {
    setMode('nitro')
  }

  const openUserSettings = (tab: UserSettingsTab = 'account') => {
    setUserSettingsTab(tab)
    setMode('user-settings')
  }

  const openUserProfile = (userId?: string) => {
    setProfileTargetId(userId ?? currentUser.id)
    setMode('user-profile')
  }

  const openDMDirect = async (otherUserId: string) => {
    if (!storeUser?.id || storeUser.id === 'pending') {
      console.error('[DM] openDMDirect sem user logado', { storeUser })
      alert('Você precisa estar logado pra abrir uma DM')
      return
    }
    console.log('[DM] openDMDirect chamado', { self: storeUser.id, other: otherUserId })
    try {
      const thread = await createOrFindDMThread(storeUser.id, otherUserId)
      console.log('[DM] thread criada/encontrada', thread)

      // Adiciona a thread na lista local caso o fetch ainda não tenha sido feito.
      // Sem isso, o DirectMessageView pode não encontrar a outra pessoa no dmUsers.
      setDmThreads((prev) => {
        if (prev.some((t) => t.id === thread.id)) return prev
        return [thread, ...prev]
      })

      // Garante que o outro usuário esteja no dmUsers map (lookup direto no Supabase).
      try {
        const sb = createClient()
        const { data: row } = await sb
          .from('users')
          .select('*')
          .eq('id', otherUserId)
          .maybeSingle()
        if (row) {
          const u: User = {
            id: row.id,
            username: row.username,
            displayName: row.display_name,
            email: row.email ?? '',
            avatarUrl: row.avatar_url,
            bannerUrl: null,
            customStatus: null,
            bio: row.bio ?? null,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at ?? row.created_at),
          }
          setDmUsers((prev) => ({ ...prev, [u.id]: u }))
        }
      } catch {
        // best-effort: openDM vai repopular depois
      }

      // IMPORTANTE: setActiveThreadId ANTES do setMode pra garantir que
      // quando o DirectMessageView for montado, o activeThreadId já está setado.
      setActiveThreadId(thread.id)
      setMode('dm')
    } catch (err: any) {
      console.error('[DM] openDMDirect falhou', err)
      alert(err?.message ?? 'Falha ao abrir DM')
    }
  }

  const channelsForCommunity = currentCommunity
    ? channels.filter((ch) => ch.communityId === currentCommunity.id)
    : []

  return (
    <TooltipProvider>
      <div className="h-screen flex overflow-hidden bg-discord-bg">
        {/* Left sidebar - Communities */}
        <Sidebar
          communities={communities}
          currentCommunityId={currentCommunity?.id}
          onSelectCommunity={handleSelectCommunity}
          onCreateCommunity={() => setShowCreateModal(true)}
          onExplore={() => {}}
          onLeaveCommunity={() => {}}
          onOpenDM={openDM}
          dmActive={mode !== 'community'}
        />

        {/* Channel list OR DM list (only when relevant) */}
        {mode === 'friends' ? (
          <DirectMessagesSidebar
            threads={dmThreads}
            users={dmUsers}
            currentUserId={currentUser.id}
            activeThreadId={activeThreadId}
            onSelectThread={(tid) => {
              setMode('dm')
              setActiveThreadId(tid)
            }}
            onCreateDM={handleCreateDM}
            onOpenFriends={openFriends}
            onOpenNitro={openNitro}
            activeNavId="friends"
            footer={
              <UserPanel
                user={currentUser}
                onLogout={handleLogout}
                onOpenProfile={() => openUserProfile()}
                onOpenSettings={openUserSettings}
              />
            }
          />
        ) : mode === 'dm' ? (
          <DirectMessagesSidebar
            threads={dmThreads}
            users={dmUsers}
            currentUserId={currentUser.id}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
            onCreateDM={handleCreateDM}
            onOpenFriends={openFriends}
            onOpenNitro={openNitro}
            activeNavId={undefined}
            footer={
              <UserPanel
                user={currentUser}
                onLogout={handleLogout}
                onOpenProfile={() => openUserProfile()}
                onOpenSettings={openUserSettings}
              />
            }
          />
        ) : mode === 'nitro' || mode === 'user-settings' || mode === 'user-profile' ? (
          <DirectMessagesSidebar
            threads={dmThreads}
            users={dmUsers}
            currentUserId={currentUser.id}
            activeThreadId={activeThreadId}
            onSelectThread={(tid) => {
              setMode('dm')
              setActiveThreadId(tid)
            }}
            onCreateDM={handleCreateDM}
            onOpenFriends={openFriends}
            onOpenNitro={openNitro}
            activeNavId={mode === 'nitro' ? 'nitro' : undefined}
            footer={
              <UserPanel
                user={currentUser}
                onLogout={handleLogout}
                onOpenProfile={() => openUserProfile()}
                onOpenSettings={openUserSettings}
              />
            }
          />
        ) : (
          <ConnectedChannelList
            channels={channelsForCommunity}
            currentChannelId={currentChannel?.id ?? null}
            onSelectChannel={setCurrentChannel}
            onCreateChannel={() => {
              setCreateChannelCategory(null)
              setShowCreateChannel(true)
            }}
            onCreateCategory={() => {
              const name = prompt('Nome da nova categoria:')?.trim()
              if (!name) return
              // Cria um canal "marcador" com nome "__category__" e usa o nome
              // como category, assim a categoria aparece na sidebar (Discord usa
              // um type "category" mas pra simplicidade usamos um canal de texto
              // que serve só de âncora visual)
              void createChannelAction(
                currentCommunity!.id,
                '—' + Math.random().toString(36).slice(2, 6),
                'text',
                name
              )
                .then((ch) => {
                  setCurrentChannel(ch)
                })
                .catch((err) => {
                  alert('Erro ao criar categoria: ' + (err?.message ?? err))
                })
            }}
            communityName={currentCommunity?.name || 'Selecione uma comunidade'}
            community={currentCommunity}
            isOwner={currentCommunity?.createdBy === currentUser.id}
            onLeaveCommunity={() => {
              if (!currentCommunity) return
              removeCommunity(currentCommunity.id)
              setCurrentCommunity(null)
              setCurrentChannel(null)
            }}
            onOpenSettings={() => {
              if (currentCommunity) {
                window.location.href = `/app/settings/${currentCommunity.id}` as any
              }
            }}
            footer={
              <UserPanel
                user={currentUser}
                onLogout={handleLogout}
                onOpenProfile={() => openUserProfile()}
                onOpenSettings={openUserSettings}
              />
            }
          />
        )}

        {/* Chat / Voice / DM / Friends / Nitro area */}
        {mode === 'nitro' ? (
          <NitroPage onBack={() => setMode('dm')} />
        ) : mode === 'friends' ? (
          <FriendsPage
            currentUser={currentUser}
            onOpenDM={openDMDirect}
            onBack={() => setMode('dm')}
          />
        ) : mode === 'dm' ? (
          activeThreadId ? (
            <DirectMessageView
              threadId={activeThreadId}
              currentUser={currentUser}
              otherUser={(() => {
                const t = dmThreads.find((th) => th.id === activeThreadId)
                const oid = t?.participants.find((p) => p !== currentUser.id)
                return oid ? dmUsers[oid] ?? null : null
              })()}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-discord-bg">
              <div className="w-32 h-32 mb-5 rounded-2xl overflow-hidden bg-discord-surface shadow-2xl shadow-discord-blurple/20 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ryvolt-logo.png"
                  alt="RYVOLT"
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <h2 className="text-xl font-bold text-white">
                Bem-vindo às mensagens diretas
              </h2>
              <p className="text-sm text-discord-text-dim max-w-sm mt-1">
                Clique no <strong>+</strong> no canto superior pra começar uma conversa com um amigo.
              </p>
            </div>
          )
        ) : currentChannel?.type === 'voice' || currentChannel?.type === 'video' ? (
          <VoiceChannelView
            channelId={currentChannel.id}
            communityId={currentCommunity?.id || ''}
            channelName={currentChannel.name}
            showVideo={currentChannel.type === 'video'}
          />
        ) : (
          <ChatArea
            channelName={currentChannel?.name || 'general'}
            messages={messages}
            currentUserId={currentUser.id}
            onSendMessage={(content) => { void handleSendMessage(content) }}
            onEditMessage={(msgId, content) => {
              useChatStore.getState().updateMessage(msgId, content)
            }}
            onDeleteMessage={(msgId) => {
              useChatStore.getState().deleteMessage(msgId)
            }}
            onReact={(msgId, emoji) => {
              useChatStore.getState().addReaction(msgId, emoji, currentUser.id)
            }}
            onReply={(msg) => {
              setReplyingTo(msg)
            }}
          />
        )}

        {/* User list */}
        {mode === 'community' && <UserList members={members} />}

        {/* User settings page (fullscreen modal) */}
        {mode === 'user-settings' && (
          <UserSettingsPage
            currentUser={currentUser}
            initialTab={userSettingsTab}
            onClose={() => setMode('community')}
          />
        )}

        {/* User profile page (fullscreen modal) */}
        {mode === 'user-profile' && profileTargetId && (
          <UserProfilePage
            currentUser={currentUser}
            targetUserId={profileTargetId}
            onClose={() => setMode('community')}
            onOpenDM={(otherId) => {
              setMode('community')
              void openDMDirect(otherId)
            }}
          />
        )}

        {/* Create Community Modal */}
        <CreateCommunityModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        {/* Create Channel Modal (estilo Discord) */}
        <CreateChannelModal
          open={showCreateChannel}
          onClose={() => {
            setShowCreateChannel(false)
            setCreateChannelCategory(null)
          }}
          defaultCategory={createChannelCategory}
          existingCategories={Array.from(
            new Set(
              channelsForCommunity
                .map((c) => c.category)
                .filter((c): c is string => !!c && c.trim() !== '')
            )
          )}
          onCreate={async ({ name, type, category, isPrivate, topic }) => {
            if (!currentCommunity) throw new Error('Selecione um servidor primeiro')
            const ch = await createChannelAction(
              currentCommunity.id,
              name,
              type === 'announcement' || type === 'forum' ? 'text' : (type as 'text' | 'voice' | 'video'),
              category
            )
            // Atualiza tópico se for text/announcement/forum
            if (topic) {
              const { updateChannel } = await import('@/lib/supabase/queries')
              await updateChannel(ch.id, { name: ch.name } as any)
            }
            setCurrentChannel(ch)
          }}
        />

        {/* Command Palette — Ctrl+K global search */}
        <CommandPalette
          open={showCommand}
          onClose={() => setShowCommand(false)}
          currentChannelId={currentChannel?.id}
          currentChannel={currentChannel}
          currentCommunity={currentCommunity}
          channels={channelsForCommunity}
          communities={communities}
          localMessages={messages.map((m) => ({
            id: m.id,
            channelId: m.channelId,
            content: m.content,
            authorName: m.author?.displayName ?? m.author?.username,
          }))}
          onNavigateChannel={(channelId) => {
            const ch = channelsForCommunity.find((c) => c.id === channelId)
            if (ch) setCurrentChannel(ch)
            setMode('community')
          }}
          onNavigateCommunity={(communityId) => {
            const comm = communities.find((c) => c.id === communityId)
            if (comm) setCurrentCommunity(comm)
            setMode('community')
          }}
        />
      </div>
    </TooltipProvider>
  )
}

interface CreateCommunityModalProps {
  open: boolean
  onClose: () => void
}

function CreateCommunityModal({ open, onClose }: CreateCommunityModalProps) {
  const storeUser = useAuthStore((s) => s.user)
  const createCommunityAction = useCommunityStore((s) => s.createCommunity)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('community')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { value: 'gaming', label: 'Gaming', icon: '🎮' },
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'friends', label: 'Friends', icon: '👥' },
    { value: 'study', label: 'Study', icon: '📚' },
    { value: 'company', label: 'Company', icon: '🏢' },
    { value: 'creators', label: 'Creators', icon: '🎨' },
    { value: 'community', label: 'Community', icon: '🌐' },
    { value: 'other', label: 'Other', icon: '✨' },
  ]

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed || !storeUser?.id) return
    setError(null)
    setSubmitting(true)
    try {
      await createCommunityAction(
        storeUser.id,
        trimmed,
        description.trim() || null,
        category
      )
      setName('')
      setDescription('')
      setCategory('community')
      onClose()
    } catch (err: any) {
      console.error('createCommunity failed:', err)
      setError(err?.message ?? 'Falha ao criar comunidade')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>Create Community</ModalTitle>
          <ModalDescription>Start a new space for people to gather and chat.</ModalDescription>
        </ModalHeader>
        <div className="space-y-4">
          <Input
            label="Community Name"
            placeholder="My Awesome Community"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
          <Textarea
            label="Description"
            placeholder="Tell people what your community is about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={submitting}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-discord-text-muted">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  disabled={submitting}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors disabled:opacity-50 ${
                    category === cat.value
                      ? 'border-discord-blurple bg-discord-blurple/10'
                      : 'border-discord-deep hover:border-discord-surface2'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs text-discord-text-muted">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || submitting}
          >
            {submitting ? 'Creating…' : 'Create Community'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}
