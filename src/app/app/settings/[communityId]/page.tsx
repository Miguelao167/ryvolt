'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Trash2,
  Save,
  AlertTriangle,
  Users,
  Layers,
  Shield,
  Mail,
  Settings as SettingsIcon,
  Sparkles,
  ScrollText,
  Zap,
  Lightbulb,
  Sticker,
  Music,
  Puzzle,
  ExternalLink,
  Lock,
  Clock,
  Hammer,
  Power,
  LayoutTemplate,
  Tag,
  Heart,
  Webhook,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  Button,
  Input,
  Textarea,
  Avatar,
  ImageUploader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Switch,
} from '@/components/ui'
import { SettingsPanel, SectionHeader } from '@/components/community/CommunitySettingsSidebar'
import { ChannelManager } from '@/components/community/ChannelManager'
import { RoleManager } from '@/components/community/RoleManager'
import { MemberManager } from '@/components/community/MemberManager'
import { InviteManager } from '@/components/community/InviteManager'
import {
  useCommunityStore,
  useAuthStore,
} from '@/stores'
import type { Community, Channel, Role, Invite, CommunityMember } from '@/types'
import {
  listInvites,
  createInvite,
  deleteInvite,
  fetchBans,
  unbanMember,
  banMember,
  timeoutMember,
  fetchAuditLog,
  fetchEngagementStats,
  fetchWebhooks,
  createWebhook,
  deleteWebhook,
  fetchEmojis,
  createEmoji,
  deleteEmoji,
  type Ban,
  type Webhook as WebhookRow,
  type CustomEmoji,
  type EngagementStats,
  type AuditEvent,
} from '@/lib/supabase/queries'
import {
  uploadCommunityIcon,
  uploadCommunityBanner,
} from '@/lib/supabase/upload'

// Upload helpers for panels that need them
async function uploadEmoji(communityId: string, file: File): Promise<string> {
  const { uploadImage } = await import('@/lib/supabase/upload')
  const { url } = await uploadImage(file, `communities/${communityId}/emojis`)
  return url
}

type TabId =
  // VINDRA CODE — DESENVOLVIMENTO
  | 'server_profile'
  | 'server_tag'
  | 'engagement'
  | 'boost_perks'
  // EXPRESSÕES
  | 'emoji'
  | 'stickers'
  | 'soundboard'
  // PESSOAS
  | 'members'
  | 'roles'
  | 'invites'
  | 'access'
  // APPS
  | 'integrations'
  | 'app_directory'
  // MODERAÇÃO
  | 'security'
  | 'audit_log'
  | 'bans'
  | 'automod'
  | 'enable_community'
  | 'server_template'

// ───── Sidebar structure ─────

interface SidebarEntry {
  id: TabId
  label: string
  icon: LucideIcon
  badge?: string
}

interface SidebarSection {
  title?: string
  entries: SidebarEntry[]
}

const SIDEBAR: SidebarSection[] = [
  {
    title: 'RYVOLT — DESENVOLVIMENTO',
    entries: [
      { id: 'server_profile', label: 'Perfil do servidor', icon: ScrollText },
      { id: 'server_tag', label: 'Tag do servidor', icon: Tag },
      { id: 'engagement', label: 'Engajamento', icon: Heart },
      { id: 'boost_perks', label: 'Vantagens de Impulso', icon: Zap },
    ],
  },
  {
    title: 'EXPRESSÕES',
    entries: [
      { id: 'emoji', label: 'Emoji', icon: Lightbulb },
      { id: 'stickers', label: 'Figurinhas', icon: Sticker },
      { id: 'soundboard', label: 'Painel de efeitos sonoros', icon: Music },
    ],
  },
  {
    title: 'PESSOAS',
    entries: [
      { id: 'members', label: 'Membros', icon: Users },
      { id: 'roles', label: 'Cargos', icon: Shield },
      { id: 'invites', label: 'Convites', icon: Mail },
      { id: 'access', label: 'Acesso', icon: Lock },
    ],
  },
  {
    title: 'APPS',
    entries: [
      { id: 'integrations', label: 'Integrações', icon: Webhook },
      { id: 'app_directory', label: 'Diretório de Apps', icon: ExternalLink, badge: '↗' },
    ],
  },
  {
    title: 'MODERAÇÃO',
    entries: [
      { id: 'security', label: 'Configurações de Segurança', icon: Lock },
      { id: 'audit_log', label: 'Registro de auditoria', icon: ScrollText },
      { id: 'bans', label: 'Banimentos', icon: Hammer },
      { id: 'automod', label: 'AutoMod', icon: Shield },
      { id: 'enable_community', label: 'Habilitar comunidade', icon: Power },
      { id: 'server_template', label: 'Modelo do servidor', icon: LayoutTemplate },
    ],
  },
]

const TAB_META: Record<TabId, { label: string }> = SIDEBAR.reduce(
  (acc, section) => {
    section.entries.forEach((e) => {
      acc[e.id] = { label: e.label }
    })
    return acc
  },
  {} as Record<TabId, { label: string }>,
)

const CATEGORY_OPTIONS: { value: 'gaming' | 'technology' | 'friends' | 'study' | 'company' | 'creators' | 'community' | 'other'; label: string; icon: string }[] = [
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'technology', label: 'Tecnologia', icon: '💻' },
  { value: 'friends', label: 'Amigos', icon: '👥' },
  { value: 'study', label: 'Estudo', icon: '📚' },
  { value: 'company', label: 'Empresa', icon: '🏢' },
  { value: 'creators', label: 'Criadores', icon: '🎨' },
  { value: 'community', label: 'Comunidade', icon: '🌐' },
  { value: 'other', label: 'Outro', icon: '✨' },
]

export default function CommunitySettingsPage() {
  const params = useParams<{ communityId: string }>()
  const router = useRouter()
  const communityId = params?.communityId ?? ''

  const currentUser = useAuthStore((s) => s.user)
  const currentCommunity = useCommunityStore((s) => s.currentCommunity)
  const loadCommunity = useCommunityStore((s) => s.loadCommunity)
  const channels = useCommunityStore((s) => s.channels).filter((c) => c.communityId === communityId)
  const members = useCommunityStore((s) => s.members)
  const roles = useCommunityStore((s) => s.roles)
  const loadMembers = useCommunityStore((s) => s.loadMembers)
  const loadRoles = useCommunityStore((s) => s.loadRoles)

  const [activeTab, setActiveTab] = useState<TabId>('server_profile')
  const [invites, setInvites] = useState<Invite[]>([])
  const [bans, setBans] = useState<Ban[]>([])
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([])
  const [emojis, setEmojis] = useState<CustomEmoji[]>([])
  const [engagement, setEngagement] = useState<EngagementStats | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!communityId) return
    let cancelled = false
    ;(async () => {
      try {
        await loadCommunity(communityId)
        if (cancelled) return
        await Promise.all([
          loadMembers(communityId),
          loadRoles(communityId),
          listInvites(communityId).then(setInvites).catch(() => {}),
          fetchBans(communityId).then(setBans).catch(() => {}),
          fetchAuditLog(communityId).then(setAudit).catch(() => {}),
          fetchWebhooks(communityId).then(setWebhooks).catch(() => {}),
          fetchEmojis(communityId).then(setEmojis).catch(() => {}),
          fetchEngagementStats(communityId).then(setEngagement).catch(() => {}),
        ])
        setReady(true)
      } catch (err) {
        console.error('Failed to load community settings:', err)
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [communityId, loadCommunity, loadMembers, loadRoles])

  const isOwner = currentCommunity?.createdBy === currentUser?.id

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-discord-bg text-discord-text-dim">
        Carregando configurações...
      </div>
    )
  }

  if (!currentCommunity) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-discord-bg gap-4">
        <p className="text-discord-text-dim">Comunidade não encontrada.</p>
        <Button onClick={() => router.push('/app')}>
          <ArrowLeft className="w-4 h-4" />
          Voltar pro app
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-discord-bg">
      <SettingsSidebar
        community={currentCommunity}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => router.push('/app')}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-6 flex items-center justify-between border-b border-discord-deep bg-discord-bg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('server_profile')}
              className="text-discord-text-dim hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-discord-text-dim">{currentCommunity.name}</span>
            <span className="text-discord-text-dim">/</span>
            <span className="text-sm font-medium text-white">
              {TAB_META[activeTab]?.label ?? 'Configurações'}
            </span>
          </div>
          {isOwner && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-discord-yellow/15 text-discord-yellow">
              Você é o dono
            </span>
          )}
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex min-h-0"
          >
            <ActivePanel
              tab={activeTab}
              community={currentCommunity}
              isOwner={isOwner}
              currentUserId={currentUser?.id ?? ''}
              channels={channels}
              members={members}
              roles={roles}
              invites={invites}
              bans={bans}
              audit={audit}
              webhooks={webhooks}
              emojis={emojis}
              engagement={engagement}
              onInvitesChange={setInvites}
              onBansChange={setBans}
              onWebhooksChange={setWebhooks}
              onEmojisChange={setEmojis}
              onClose={() => setActiveTab('server_profile')}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============ SIDEBAR ============

function SettingsSidebar({
  community,
  activeTab,
  onTabChange,
  onBack,
}: {
  community: Community
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onBack: () => void
}) {
  return (
    <aside className="w-60 h-full bg-discord-surface border-r border-discord-deep flex flex-col">
      <div className="p-4 border-b border-discord-deep space-y-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-discord-text-dim hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pro app
        </button>
        <div className="flex items-center gap-3">
          <Avatar src={community.iconUrl} alt={community.name} size="md" />
          <div className="min-w-0">
            <div className="font-semibold text-white truncate">
              {community.name}
            </div>
            <div className="text-xs text-discord-text-dim truncate">
              Configurações
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {SIDEBAR.map((section, idx) => (
          <div key={section.title ?? idx}>
            {section.title && (
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-discord-text-dim">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.entries.map((entry) => {
                const Icon = entry.icon
                const active = activeTab === entry.id
                return (
                  <button
                    key={entry.id}
                    onClick={() => onTabChange(entry.id)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-left text-sm transition-colors ${
                      active
                        ? 'bg-discord-hover text-white font-medium'
                        : 'text-discord-text-muted hover:bg-discord-hover hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{entry.label}</span>
                    {entry.badge && (
                      <span className="text-xs text-discord-text-dim">{entry.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer — Excluir servidor */}
        <div className="pt-2">
          <button
            onClick={() => onTabChange('server_template')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir servidor
          </button>
        </div>
      </nav>
    </aside>
  )
}

// ============ PANEL SWITCH ============

interface PanelProps {
  tab: TabId
  community: Community
  isOwner: boolean
  currentUserId: string
  channels: Channel[]
  members: CommunityMember[]
  roles: Role[]
  invites: Invite[]
  bans: Ban[]
  audit: AuditEvent[]
  webhooks: WebhookRow[]
  emojis: CustomEmoji[]
  engagement: EngagementStats | null
  onInvitesChange: (i: Invite[]) => void
  onBansChange: (b: Ban[]) => void
  onWebhooksChange: (w: WebhookRow[]) => void
  onEmojisChange: (e: CustomEmoji[]) => void
  onClose: () => void
}

function ActivePanel(props: PanelProps) {
  const { tab, community, isOwner, currentUserId, members, roles, invites, bans, audit, webhooks, emojis, engagement, onInvitesChange, onBansChange, onWebhooksChange, onEmojisChange } = props
  switch (tab) {
    case 'server_profile':
      return <ServerProfilePanel community={community} isOwner={isOwner} />
    case 'server_tag':
      return <ServerTagPanel community={community} />
    case 'engagement':
      return <EngagementPanel community={community} stats={engagement} />
    case 'boost_perks':
      return <BoostPerksPanel community={community} />
    case 'emoji':
      return <EmojiPanel isOwner={isOwner} communityId={community.id} emojis={emojis} onEmojisChange={onEmojisChange} />
    case 'stickers':
      return <StickersPanel />
    case 'soundboard':
      return <SoundboardPanel />
    case 'members':
      return <MembersPanel members={members} roles={roles} currentUserId={currentUserId} isOwner={isOwner} />
    case 'roles':
      return <RolesPanel communityId={community.id} roles={roles} />
    case 'invites':
      return <InvitesPanel communityId={community.id} communityName={community.name} invites={invites} onInvitesChange={onInvitesChange} userId={currentUserId} />
    case 'access':
      return <AccessPanel isOwner={isOwner} />
    case 'integrations':
      return <IntegrationsPanel isOwner={isOwner} communityId={community.id} channels={props.channels} currentUserId={currentUserId} webhooks={webhooks} onWebhooksChange={onWebhooksChange} />
    case 'app_directory':
      return <AppDirectoryPanel />
    case 'security':
      return <SecurityPanel isOwner={isOwner} />
    case 'audit_log':
      return <AuditLogPanel events={audit} />
    case 'bans':
      return <BansPanel communityId={community.id} bans={bans} isOwner={isOwner} onBansChange={onBansChange} />
    case 'automod':
      return <AutoModPanel isOwner={isOwner} />
    case 'enable_community':
      return <EnableCommunityPanel community={community} />
    case 'server_template':
      return <ServerTemplatePanel community={community} isOwner={isOwner} />
  }
}

// ============ PANELS ============

// ── VINDRA CODE ────────────────────────────────────────────────

function ServerProfilePanel({ community, isOwner }: { community: Community; isOwner: boolean }) {
  const saveCommunity = useCommunityStore((s) => s.saveCommunity)
  const removeCommunityAction = useCommunityStore((s) => s.removeCommunityAction)
  const router = useRouter()

  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description ?? '')
  const [category, setCategory] = useState<typeof community.category>(community.category ?? 'community')
  const [iconUrl, setIconUrl] = useState(community.iconUrl ?? '')
  const [bannerUrl, setBannerUrl] = useState(community.bannerUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dirty =
    name !== community.name ||
    description !== (community.description ?? '') ||
    category !== (community.category ?? 'community') ||
    iconUrl !== (community.iconUrl ?? '') ||
    bannerUrl !== (community.bannerUrl ?? '')

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await saveCommunity(community.id, {
        name: name.trim(),
        description: description.trim() || null,
        category,
        iconUrl: iconUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await removeCommunityAction(community.id)
    router.push('/app')
  }

  return (
    <SettingsPanel>
      <SectionHeader
        title="Perfil do servidor"
        description="Nome, ícone, banner e descrição — como o servidor aparece pros outros."
      />

      <div className="space-y-6">
        {/* Banner */}
        <Card title="Banner do servidor">
          <ImageUploader
            variant="banner"
            value={bannerUrl || null}
            alt={name}
            disabled={!isOwner}
            onUpload={async (file) => {
              const url = await uploadCommunityBanner(community.id, file)
              setBannerUrl(url)
              return url
            }}
            onChange={(url) => setBannerUrl(url ?? '')}
          />
        </Card>

        {/* Ícone */}
        <Card title="Ícone">
          <ImageUploader
            variant="avatar"
            value={iconUrl || null}
            alt={name}
            fallback={name[0]?.toUpperCase()}
            disabled={!isOwner}
            onUpload={async (file) => {
              const url = await uploadCommunityIcon(community.id, file)
              setIconUrl(url)
              return url
            }}
            onChange={(url) => setIconUrl(url ?? '')}
          />
        </Card>

        {/* Nome */}
        <Card title="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
        </Card>

        {/* Descrição */}
        <Card title="Descrição">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={!isOwner}
            placeholder="Sobre o que é a sua comunidade?"
          />
        </Card>

        {/* Categoria */}
        <Card title="Categoria">
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                disabled={!isOwner}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors disabled:opacity-50 ${
                  category === c.value
                    ? 'border-discord-blurple bg-discord-blurple/10'
                    : 'border-discord-deep hover:border-discord-surface2'
                }`}
              >
                <span className="text-xl">{c.icon}</span>
                <span className="text-xs text-discord-text-muted">{c.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Membros" value={community.memberCount ?? '—'} />
          <StatCard label="Nível de impulso" value="0" />
          <StatCard label="Criada em" value={community.createdAt?.toLocaleDateString('pt-BR') ?? '—'} />
        </div>

        {/* Salvar */}
        {isOwner && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!dirty || !name.trim() || saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        )}

        {/* Zona de perigo */}
        {isOwner && (
          <div className="mt-12 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Zona de perigo</h3>
            </div>
            <p className="text-xs text-discord-text-dim mb-3">
              Apagar a comunidade remove todos os canais, mensagens e membros. Não dá pra desfazer.
            </p>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-4 h-4" />
              Apagar comunidade
            </Button>
          </div>
        )}
      </div>

      <Modal open={confirmDelete} onOpenChange={setConfirmDelete}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Apagar {community.name}?</ModalTitle>
          </ModalHeader>
          <div className="text-sm text-discord-text-muted space-y-2">
            <p>
              Tem certeza que quer apagar <strong>{community.name}</strong>?
            </p>
            <p>
              Todos os canais, mensagens e histórico de membros serão excluídos permanentemente.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Apagar
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </SettingsPanel>
  )
}

function ServerTagPanel({ community }: { community: Community }) {
  const [tag, setTag] = useState('')
  const [copied, setCopied] = useState(false)

  const fullTag = `${community.name}${tag ? ` | ${tag}` : ''}`

  const copy = () => {
    navigator.clipboard.writeText(fullTag)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <SettingsPanel>
      <SectionHeader
        title="Tag do servidor"
        description="Uma frase curta que aparece na tag do servidor (visível pra todos)."
      />

      <Card title="Tag">
        <div className="space-y-3">
          <Input
            placeholder="EX: • comunidade gamer"
            value={tag}
            onChange={(e) => setTag(e.target.value.slice(0, 32))}
            maxLength={32}
          />
          <div className="p-3 rounded-lg bg-discord-bg border border-discord-deep flex items-center justify-between">
            <span className="text-sm text-white">{fullTag}</span>
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
          <p className="text-xs text-discord-text-dim">
            Máximo de 32 caracteres. A tag complementa o nome do servidor.
          </p>
        </div>
      </Card>
    </SettingsPanel>
  )
}

function EngagementPanel({ community, stats }: { community: Community; stats: EngagementStats | null }) {
  return (
    <SettingsPanel>
      <SectionHeader
        title="Engajamento"
        description="Métricas de atividade da comunidade"
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Mensagens hoje" value={stats?.messagesToday ?? 0} />
        <StatCard label="Mensagens na semana" value={stats?.messagesThisWeek ?? 0} />
        <StatCard label="Membros ativos" value={stats?.activeMembers ?? 0} />
        <StatCard label="Convites pendentes" value={stats?.pendingInvites ?? 0} />
      </div>

      <Card title="Resumo">
        <p className="text-sm text-discord-text-muted">
          Olhe a atividade de {community.name} pra entender o que engaja mais a galera.
          Os números são atualizados em tempo real conforme mensagens e entradas/saídas acontecem.
        </p>
      </Card>
    </SettingsPanel>
  )
}

function BoostPerksPanel({ community }: { community: Community }) {
  const tiers = [
    { tier: 1, name: 'Impulso Nível 1', perks: ['+50% uploads de áudio', 'Emoji personalizado', 'Banner do servidor animado'] },
    { tier: 2, name: 'Impulso Nível 2', perks: ['+50% uploads de áudios', 'Qualidade de áudio 256kbps', 'Sticker personalizado'] },
    { tier: 3, name: 'Impulso Nível 3', perks: ['Limite de canais +100', 'URL personalizada', 'Limite de banidos +1000'] },
  ]

  return (
    <SettingsPanel>
      <SectionHeader
        title="Vantagens de Impulso"
        description="Recompensas pra quem impulsiona a comunidade"
      />

      <Card title={`Nível atual de ${community.name}`}>
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-discord-blurple" />
          <div>
            <div className="text-2xl font-bold text-white">Nível 0</div>
            <div className="text-xs text-discord-text-dim">0 impulsos</div>
          </div>
        </div>
      </Card>

      <div className="mt-6 space-y-3">
        {tiers.map((t) => (
          <div
            key={t.tier}
            className="p-4 rounded-lg border border-discord-deep bg-discord-surface"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-discord-yellow" />
              <span className="font-semibold text-white">{t.name}</span>
            </div>
            <ul className="space-y-1 text-sm text-discord-text-muted">
              {t.perks.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-blurple" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SettingsPanel>
  )
}

// ── EXPRESSÕES ────────────────────────────────────────────────

function EmojiPanel({ isOwner, communityId, emojis, onEmojisChange }: {
  isOwner: boolean
  communityId: string
  emojis: CustomEmoji[]
  onEmojisChange: (e: CustomEmoji[]) => void
}) {
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File): Promise<string> => {
    if (!newName.trim()) {
      throw new Error('Defina um nome antes de enviar a imagem')
    }
    setUploading(true)
    try {
      const url = await uploadEmoji(communityId, file)
      const emoji = await createEmoji(communityId, newName.trim(), url, '')
      onEmojisChange([emoji, ...emojis])
      setNewName('')
      return url
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteEmoji(id)
    onEmojisChange(emojis.filter((e) => e.id !== id))
  }

  return (
    <SettingsPanel>
      <SectionHeader
        title="Emoji"
        description="Emojis personalizados só da sua comunidade"
      />

      {isOwner && (
        <Card title="Adicionar emoji">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input
              placeholder="Nome (sem dois pontos)"
              value={newName}
              onChange={(e) => setNewName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            />
            <ImageUploader
              variant="square"
              className="h-10"
              value={null}
              alt="emoji"
              disabled={!newName.trim() || uploading}
              onUpload={handleUpload}
              onChange={() => {}}
            />
          </div>
          {uploading && (
            <p className="text-xs text-discord-text-dim">Enviando imagem...</p>
          )}
        </Card>
      )}

      {emojis.length === 0 ? (
        <Card title="Sem emojis ainda">
          <p className="text-sm text-discord-text-dim">
            Nenhum emoji cadastrado pra essa comunidade.
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-3 md:grid-cols-5 gap-3">
          {emojis.map((e) => (
            <div
              key={e.id}
              className="relative p-3 rounded-lg border border-discord-deep bg-discord-surface flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded bg-discord-bg flex items-center justify-center overflow-hidden">
                <img src={e.imageUrl} alt={e.name} className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-discord-text-dim truncate w-full text-center">
                :{e.name}:
              </span>
              {isOwner && (
                <button
                  onClick={() => handleDelete(e.id)}
                  className="absolute top-1 right-1 p-1 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Excluir"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </SettingsPanel>
  )
}

function StickersPanel() {
  return (
    <SettingsPanel>
      <SectionHeader
        title="Figurinhas"
        description="Stickers só da sua comunidade"
      />

      <Card title="Em breve">
        <p className="text-sm text-discord-text-dim">
          Suporte a stickers PNG, APNG e Lottie. Em breve.
        </p>
      </Card>
    </SettingsPanel>
  )
}

function SoundboardPanel() {
  const sounds = [
    { name: 'bruh', emoji: '🤦' },
    { name: 'tada', emoji: '🎉' },
    { name: 'sad', emoji: '😢' },
  ]

  return (
    <SettingsPanel>
      <SectionHeader
        title="Painel de efeitos sonoros"
        description="Sons que os membros podem tocar nos canais de voz"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sounds.map((s) => (
          <div
            key={s.name}
            className="p-3 rounded-lg border border-discord-deep bg-discord-surface flex items-center gap-3"
          >
            <span className="text-2xl">{s.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{s.name}</div>
              <div className="text-xs text-discord-text-dim">Global</div>
            </div>
            <Button size="sm" variant="secondary">
              Tocar
            </Button>
          </div>
        ))}
      </div>
    </SettingsPanel>
  )
}

// ── PESSOAS ────────────────────────────────────────────────

function MembersPanel({ members, roles, currentUserId, isOwner }: {
  members: CommunityMember[]
  roles: Role[]
  currentUserId: string
  isOwner: boolean
}) {
  const updateMember = useCommunityStore((s) => s.updateMemberInState)
  const removeMember = useCommunityStore((s) => s.removeMemberFromState)
  const kickMemberAction = useCommunityStore((s) => s.kickMemberAction)
  const changeMemberRole = useCommunityStore((s) => s.changeMemberRole)

  if (!isOwner) {
    return (
      <SettingsPanel>
        <SectionHeader title="Membros" description="Lista de pessoas na comunidade" />
        <div className="text-sm text-discord-text-dim">
          Apenas o dono pode gerenciar membros.
        </div>
      </SettingsPanel>
    )
  }

  return (
    <SettingsPanel>
      <MemberManager
        members={members}
        roles={roles}
        currentUserId={currentUserId}
        onUpdateMember={async (memberId: string, updates: Partial<CommunityMember>) => {
          if (updates.roleId) {
            await changeMemberRole(memberId, updates.roleId)
          } else {
            updateMember(memberId, updates)
          }
        }}
        onKickMember={async (memberId: string) => {
          await kickMemberAction(memberId)
        }}
        onBanMember={async (memberId: string) => {
          await banMember(memberId)
          removeMember(memberId)
        }}
        onTimeoutMember={async (memberId: string, duration: number) => {
          await timeoutMember(memberId, duration)
        }}
      />
    </SettingsPanel>
  )
}

function RolesPanel({ communityId, roles }: {
  communityId: string
  roles: Role[]
}) {
  const createRoleAction = useCommunityStore((s) => s.createRoleAction)
  const saveRole = useCommunityStore((s) => s.saveRole)
  const removeRoleAction = useCommunityStore((s) => s.removeRoleAction)

  return (
    <SettingsPanel>
      <RoleManager
        roles={roles}
        onCreateRole={async (role: Partial<Role>) => {
          await createRoleAction(
            communityId,
            role.name ?? 'Sem nome',
            role.color ?? '#3B82F6',
            role.permissions ?? [],
          )
        }}
        onUpdateRole={async (roleId: string, updates: Partial<Role>) => {
          await saveRole(roleId, {
            name: updates.name,
            color: updates.color,
            permissions: updates.permissions,
          })
        }}
        onDeleteRole={async (roleId: string) => {
          await removeRoleAction(roleId)
        }}
      />
    </SettingsPanel>
  )
}

function InvitesPanel({ communityId, communityName, invites, onInvitesChange, userId }: {
  communityId: string
  communityName: string
  invites: Invite[]
  onInvitesChange: (i: Invite[]) => void
  userId: string
}) {
  return (
    <SettingsPanel>
      <InviteManager
        invites={invites}
        communityName={communityName}
        onCreateInvite={async (partial: Partial<Invite>) => {
          const invite = await createInvite(communityId, userId, {
            maxUses: partial.max_uses ?? null,
            expiresInHours: null,
          })
          onInvitesChange([invite, ...invites])
        }}
        onDeleteInvite={async (inviteId: string) => {
          await deleteInvite(inviteId)
          onInvitesChange(invites.filter((i) => i.id !== inviteId))
        }}
        onCopyInvite={(inviteCode) => {
          navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`).catch(() => {})
        }}
      />
    </SettingsPanel>
  )
}

function AccessPanel({ isOwner }: { isOwner: boolean }) {
  const [require2FA, setRequire2FA] = useState(false)
  const [discovery, setDiscovery] = useState(true)
  const [defaultChannel, setDefaultChannel] = useState('general')

  return (
    <SettingsPanel>
      <SectionHeader
        title="Acesso"
        description="Quem pode entrar e como o servidor é descoberto"
      />

      <div className="space-y-4">
        <ToggleRow
          label="Exigir 2FA pra moderação"
          description="Só moderadores com autenticação em duas etapas podem banir, kickar ou apagar mensagens."
          checked={require2FA}
          onChange={setRequire2FA}
          disabled={!isOwner}
        />
        <ToggleRow
          label="Servidor descobrível"
          description="Permite que outras pessoas achem a comunidade no diretório."
          checked={discovery}
          onChange={setDiscovery}
          disabled={!isOwner}
        />
        <Card title="Canal padrão">
          <Input
            value={defaultChannel}
            onChange={(e) => setDefaultChannel(e.target.value)}
            disabled={!isOwner}
            placeholder="general"
          />
        </Card>
        <Card title="Verificação de e-mail">
          <p className="text-sm text-discord-text-dim">
            Quem pode entrar precisa confirmar o e-mail antes de mandar mensagens.
          </p>
          <ToggleRow
            label="Exigir e-mail verificado"
            description="Recomendado pra reduzir spam."
            checked={true}
            onChange={() => {}}
            disabled
          />
        </Card>
      </div>
    </SettingsPanel>
  )
}

// ── APPS ────────────────────────────────────────────────

function IntegrationsPanel({ isOwner, communityId, channels, currentUserId, webhooks, onWebhooksChange }: {
  isOwner: boolean
  communityId: string
  channels: Channel[]
  currentUserId: string
  webhooks: WebhookRow[]
  onWebhooksChange: (w: WebhookRow[]) => void
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [channelId, setChannelId] = useState(channels[0]?.id ?? '')
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const textChannels = channels.filter((c) => c.type === 'text')

  const handleCreate = async () => {
    if (!name.trim() || !channelId) return
    setCreating(true)
    try {
      const hook = await createWebhook(communityId, channelId, name.trim(), currentUserId)
      onWebhooksChange([hook, ...webhooks])
      setName('')
      setShowForm(false)
    } catch (err: any) {
      alert(err?.message ?? 'Falha ao criar webhook')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esse webhook?')) return
    await deleteWebhook(id)
    onWebhooksChange(webhooks.filter((w) => w.id !== id))
  }

  const copyUrl = (w: WebhookRow) => {
    navigator.clipboard.writeText(w.url)
    setCopiedId(w.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <SettingsPanel>
      <SectionHeader
        title="Integrações"
        description="Webhooks e serviços externos"
      />

      {webhooks.length === 0 ? (
        <Card title="Nenhum webhook">
          <p className="text-sm text-discord-text-dim mb-3">
            Webhooks permitem que serviços externos enviem mensagens em nome dos canais.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => {
            const ch = channels.find((c) => c.id === w.channelId)
            return (
              <div
                key={w.id}
                className="p-4 rounded-lg border border-discord-deep bg-discord-surface"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {w.name}
                    </div>
                    <div className="text-xs text-discord-text-dim truncate">
                      {ch ? `#${ch.name}` : 'Canal removido'}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-[10px] px-2 py-1 rounded bg-discord-bg font-mono truncate">
                        {w.url}
                      </code>
                      <button
                        onClick={() => copyUrl(w)}
                        className="text-xs text-discord-blurple hover:underline shrink-0"
                      >
                        {copiedId === w.id ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(w.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isOwner && (
        <div className="mt-6">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} disabled={textChannels.length === 0}>
              <Webhook className="w-4 h-4" />
              Novo webhook
            </Button>
          ) : (
            <Card title="Novo webhook">
              <div className="space-y-3">
                <Input
                  placeholder="Nome do webhook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-discord-bg border border-discord-deep text-sm"
                >
                  <option value="">Selecione um canal</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!name.trim() || !channelId || creating}>
                    {creating ? 'Criando...' : 'Criar'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </SettingsPanel>
  )
}

function AppDirectoryPanel() {
  const apps = [
    { name: 'YouTube Together', description: 'Assiste YouTube com a galera ao mesmo tempo', emoji: '▶️' },
    { name: 'Spotify Listen Along', description: 'Mostra o que você tá ouvindo', emoji: '🎵' },
    { name: 'GameStats', description: 'Mostra seus stats em jogos no perfil', emoji: '🎮' },
    { name: 'Meme Bot', description: 'Memes sob demanda', emoji: '😂' },
  ]

  return (
    <SettingsPanel>
      <SectionHeader
        title="Diretório de Apps"
        description="Apps oficiais e da comunidade pra turbinar o servidor"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {apps.map((a) => (
          <div
            key={a.name}
            className="p-4 rounded-lg border border-discord-deep bg-discord-surface"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{a.emoji}</span>
              <div>
                <div className="font-semibold text-white">{a.name}</div>
              </div>
            </div>
            <p className="text-sm text-discord-text-muted mb-3">{a.description}</p>
            <Button variant="secondary" size="sm">
              Adicionar
            </Button>
          </div>
        ))}
      </div>
    </SettingsPanel>
  )
}

// ── MODERAÇÃO ────────────────────────────────────────────────

function SecurityPanel({ isOwner }: { isOwner: boolean }) {
  const [explicitMedia, setExplicitMedia] = useState(true)
  const [verification, setVerification] = useState<'none' | 'low' | 'medium' | 'high'>('low')

  return (
    <SettingsPanel>
      <SectionHeader
        title="Configurações de Segurança"
        description="Privacidade e proteção dos membros"
      />

      <div className="space-y-4">
        <Card title="Nível de verificação">
          <p className="text-sm text-discord-text-dim mb-3">
            Define o que um membro precisa fazer antes de mandar mensagens.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['none', 'low', 'medium', 'high'] as const).map((v) => (
              <button
                key={v}
                onClick={() => isOwner && setVerification(v)}
                disabled={!isOwner}
                className={`p-3 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                  verification === v
                    ? 'border-discord-blurple bg-discord-blurple/10'
                    : 'border-discord-deep hover:border-discord-surface2'
                }`}
              >
                {v === 'none' && 'Nenhum'}
                {v === 'low' && 'Baixo'}
                {v === 'medium' && 'Médio'}
                {v === 'high' && 'Alto'}
              </button>
            ))}
          </div>
        </Card>

        <ToggleRow
          label="Conteúdo explícito"
          description="Permite que canais sejam marcados como NSFW."
          checked={explicitMedia}
          onChange={setExplicitMedia}
          disabled={!isOwner}
        />

        <Card title="Proteção contra DDoS">
          <p className="text-sm text-discord-text-dim">
            Ativo. Detectamos e mitigamos ataques automaticamente.
          </p>
        </Card>
      </div>
    </SettingsPanel>
  )
}

function AuditLogPanel({ events }: { events: AuditEvent[] }) {
  return (
    <SettingsPanel>
      <SectionHeader
        title="Registro de auditoria"
        description="Histórico de ações de moderação"
      />

      {events.length === 0 ? (
        <Card title="Sem eventos">
          <p className="text-sm text-discord-text-dim">
            Nenhuma ação registrada ainda. Eventos como bans, canais criados e novos membros aparecem aqui.
          </p>
        </Card>
      ) : (
        <Card title={`${events.length} eventos recentes`}>
          <div className="divide-y divide-discord-deep">
            {events.map((e) => (
              <div key={e.id} className="py-3 flex items-start gap-3">
                <Clock className="w-4 h-4 text-discord-text-dim mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">
                    <span className="font-semibold">{e.actorName}</span>{' '}
                    <span className="text-discord-text-muted">{e.action}</span>
                  </div>
                  <div className="text-xs text-discord-text-dim">
                    {formatDateTime(e.at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </SettingsPanel>
  )
}

function BansPanel({ communityId, bans, isOwner, onBansChange }: {
  communityId: string
  bans: Ban[]
  isOwner: boolean
  onBansChange: (b: Ban[]) => void
}) {
  const handleUnban = async (b: Ban) => {
    if (!confirm(`Desbanir ${b.user?.displayName ?? b.user?.username ?? 'esse usuário'}?`)) return
    try {
      await unbanMember(communityId, b.userId)
      onBansChange(bans.filter((x) => x.id !== b.id))
    } catch (err: any) {
      alert(err?.message ?? 'Falha ao desbanir')
    }
  }

  return (
    <SettingsPanel>
      <SectionHeader
        title="Banimentos"
        description="Lista de usuários que não podem entrar"
      />

      {bans.length === 0 ? (
        <Card title="Sem banimentos">
          <p className="text-sm text-discord-text-dim">
            Ninguém foi banido dessa comunidade ainda. Quem for banido aparece aqui.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {bans.map((b) => {
            const name = b.user?.displayName ?? b.user?.username ?? 'Usuário removido'
            const handle = b.user?.username ?? b.userId.slice(0, 8)
            return (
              <div
                key={b.id}
                className="p-3 rounded-lg border border-discord-deep bg-discord-surface flex items-center gap-3"
              >
                <Avatar src={b.user?.avatarUrl} alt={name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {name}
                  </div>
                  <div className="text-xs text-discord-text-dim truncate">
                    @{handle}{b.reason ? ` • ${b.reason}` : ''} • banido em {formatDate(b.createdAt)}
                  </div>
                </div>
                {isOwner && (
                  <Button variant="secondary" size="sm" onClick={() => handleUnban(b)}>
                    Desbanir
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </SettingsPanel>
  )
}

function AutoModPanel({ isOwner }: { isOwner: boolean }) {
  const [spamFilter, setSpamFilter] = useState(true)
  const [profanityFilter, setProfanityFilter] = useState(true)
  const [mentionSpam, setMentionSpam] = useState(5)

  return (
    <SettingsPanel>
      <SectionHeader
        title="AutoMod"
        description="Filtros automáticos de mensagens"
      />

      <div className="space-y-4">
        <ToggleRow
          label="Filtro de spam"
          description="Detecta mensagens repetidas ou enviadas em massa."
          checked={spamFilter}
          onChange={setSpamFilter}
          disabled={!isOwner}
        />
        <ToggleRow
          label="Filtro de palavrão"
          description="Apaga mensagens com termos bloqueados."
          checked={profanityFilter}
          onChange={setProfanityFilter}
          disabled={!isOwner}
        />
        <Card title="Limite de menções">
          <p className="text-sm text-discord-text-dim mb-3">
            Quantidade máxima de menções por mensagem antes de alertar o AutoMod.
          </p>
          <Input
            type="number"
            value={mentionSpam}
            onChange={(e) => setMentionSpam(parseInt(e.target.value) || 0)}
            disabled={!isOwner}
          />
        </Card>
      </div>
    </SettingsPanel>
  )
}

function EnableCommunityPanel({ community }: { community: Community }) {
  const [enabled, setEnabled] = useState(false)

  return (
    <SettingsPanel>
      <SectionHeader
        title="Habilitar comunidade"
        description={`Transforma ${community.name} numa comunidade com canais de atualizações, diretório e descoberta.`}
      />

      <Card title="Recursos quando habilitado">
        <ul className="space-y-2 text-sm text-discord-text-muted">
          <li>• Canal de atualizações</li>
          <li>• Canal de regras</li>
          <li>• Listagem pública no diretório</li>
          <li>• Insights de atividade</li>
        </ul>
      </Card>

      <div className="mt-4">
        <ToggleRow
          label="Habilitar comunidade"
          description="Mostra o servidor pra qualquer pessoa."
          checked={enabled}
          onChange={setEnabled}
        />
      </div>
    </SettingsPanel>
  )
}

function ServerTemplatePanel({ community, isOwner }: { community: Community; isOwner: boolean }) {
  const router = useRouter()
  const removeCommunityAction = useCommunityStore((s) => s.removeCommunityAction)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    await removeCommunityAction(community.id)
    router.push('/app')
  }

  return (
    <SettingsPanel>
      <SectionHeader
        title="Modelo do servidor"
        description="Use o servidor como modelo ou apague a comunidade"
      />

      <Card title="Criar modelo">
        <p className="text-sm text-discord-text-dim mb-3">
          Compartilhe a estrutura (canais, cargos, configurações) com outras pessoas.
        </p>
        <Button variant="secondary" disabled={!isOwner}>
          Criar a partir deste servidor
        </Button>
      </Card>

      {isOwner && (
        <div className="mt-8 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Excluir servidor</h3>
          </div>
          <p className="text-xs text-discord-text-dim mb-3">
            Essa ação remove tudo: canais, mensagens, cargos, membros. Não dá pra desfazer.
          </p>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-4 h-4" />
            Excluir {community.name}
          </Button>
        </div>
      )}

      <Modal open={confirmDelete} onOpenChange={setConfirmDelete}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Apagar {community.name}?</ModalTitle>
          </ModalHeader>
          <div className="text-sm text-discord-text-muted">
            <p>
              Tem certeza que quer apagar <strong>{community.name}</strong>?
            </p>
            <p className="mt-2">
              Todos os canais, mensagens e histórico de membros serão excluídos permanentemente.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Apagar
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </SettingsPanel>
  )
}

// ============ helpers ============

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR')
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function combinePermissions(perms: number[]): number {
  return perms.reduce((acc, p) => acc | p, 0)
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-discord-surface border border-discord-deep">
      <div className="text-xs uppercase tracking-wider text-discord-text-dim mb-1">
        {label}
      </div>
      <div className="text-lg font-semibold text-white capitalize">
        {value}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-discord-surface border border-discord-deep">
      <div className="text-xs font-semibold uppercase tracking-wider text-discord-text-dim mb-3">
        {title}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="p-4 rounded-lg border border-discord-deep bg-discord-surface flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-discord-text-dim">{description}</div>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}
