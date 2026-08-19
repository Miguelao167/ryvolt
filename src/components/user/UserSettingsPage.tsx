'use client'

import { useState } from 'react'
import {
  X,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  Shield,
  Users,
  Palette,
  Mic,
  Video,
  Bell,
  Keyboard,
  Languages,
  Accessibility as AccessibilityIcon,
  Settings as SettingsIcon,
  Edit3,
  Camera,
  Mail,
  Phone,
  Smartphone,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Trash2,
  Download,
  Volume2,
  Headphones,
  Activity,
  Monitor,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Avatar, Button, Input, Textarea, Switch } from '@/components/ui'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useAuthStore } from '@/stores/authStore'
import {
  useMediaSettingsStore,
  type InputProfile,
} from '@/stores/mediaSettingsStore'
import { useMediaDevices } from '@/hooks/useMediaDevices'
import { MicTestModal } from './MicTestModal'
import {
  uploadUserAvatar,
  uploadUserBanner,
  deleteImage,
  extractStoragePath,
} from '@/lib/supabase/upload'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

interface UserSettingsPageProps {
  currentUser: User
  onClose: () => void
  initialTab?: UserSettingsTab
}

export type UserSettingsTab =
  | 'account'
  | 'profile'
  | 'privacy'
  | 'family'
  | 'appearance'
  | 'voice'
  | 'notifications'
  | 'keybinds'
  | 'language'
  | 'accessibility'
  | 'advanced'

const SECTIONS: { id: UserSettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'account', label: 'Minha conta', icon: <UserIcon className="w-4 h-4" /> },
  { id: 'profile', label: 'Perfil', icon: <Edit3 className="w-4 h-4" /> },
  { id: 'privacy', label: 'Privacidade e segurança', icon: <Shield className="w-4 h-4" /> },
  { id: 'family', label: 'Família', icon: <Users className="w-4 h-4" /> },
  { id: 'appearance', label: 'Aparência', icon: <Palette className="w-4 h-4" /> },
  { id: 'voice', label: 'Voz e vídeo', icon: <Mic className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notificações', icon: <Bell className="w-4 h-4" /> },
  { id: 'keybinds', label: 'Keybinds', icon: <Keyboard className="w-4 h-4" /> },
  { id: 'language', label: 'Idioma', icon: <Languages className="w-4 h-4" /> },
  { id: 'accessibility', label: 'Acessibilidade', icon: <AccessibilityIcon className="w-4 h-4" /> },
  { id: 'advanced', label: 'Avançado', icon: <SettingsIcon className="w-4 h-4" /> },
]

export function UserSettingsPage({ currentUser, onClose, initialTab = 'account' }: UserSettingsPageProps) {
  const [tab, setTab] = useState<UserSettingsTab>(initialTab)
  const [query, setQuery] = useState('')

  const filteredSections = SECTIONS.filter((s) =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 bg-discord-bg flex flex-col">
      {/* Header */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-discord-deep shrink-0">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-discord-text-dim" />
          <h1 className="font-semibold text-white">Configurações</h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-discord-hover text-discord-text-dim hover:text-white"
          title="Fechar (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r border-discord-deep flex flex-col">
          <div className="p-3 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar"
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md bg-discord-surface border border-discord-deep text-white placeholder:text-discord-text-dim focus:outline-none focus:border-discord-blurple"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  tab === s.id
                    ? 'bg-discord-hover text-white'
                    : 'text-discord-text-muted hover:bg-discord-hover hover:text-white'
                )}
              >
                <span className={tab === s.id ? 'text-white' : 'text-discord-text-dim'}>
                  {s.icon}
                </span>
                <span className="flex-1 text-left">{s.label}</span>
                <ChevronRight className="w-4 h-4 text-discord-text-dim" />
              </button>
            ))}

            <div className="my-3 border-t border-discord-deep" />
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-discord-text-muted hover:bg-discord-hover hover:text-white">
              <span className="text-discord-text-dim">ⓘ</span>
              <span className="flex-1 text-left">Sobre</span>
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {tab === 'account' && <AccountSection user={currentUser} />}
          {tab === 'profile' && <ProfileSection user={currentUser} />}
          {tab === 'privacy' && <PrivacySection user={currentUser} />}
          {tab === 'family' && <FamilySection />}
          {tab === 'appearance' && <AppearanceSection />}
          {tab === 'voice' && <VoiceSection />}
          {tab === 'notifications' && <NotificationsSection />}
          {tab === 'keybinds' && <KeybindsSection />}
          {tab === 'language' && <LanguageSection />}
          {tab === 'accessibility' && <AccessibilitySection />}
          {tab === 'advanced' && <AdvancedSection />}
        </main>
      </div>
    </div>
  )
}

// =============== SECTION: MINHA CONTA ===============

function AccountSection({ user }: { user: User }) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user.displayName)
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState('')
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const supabase = createClient()

  const save = async () => {
    try {
      const updates: Record<string, any> = {
        display_name: displayName,
        username,
      }
      if (email && email !== user.email) updates.email = email
      const { error } = await supabase.from('users').update(updates).eq('id', user.id)
      if (error) throw error
      updateProfile({ displayName, username, email: email || user.email })
      toast.success('Conta atualizada')
      setEditing(false)
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao salvar')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Minha conta</h2>
      <p className="text-sm text-discord-text-dim mb-6">
        Gerencie suas informações de login e os dados da sua conta.
      </p>

      <Section title="Informações da conta">
        <Row label="Nome de usuário">
          {editing ? (
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          ) : (
            <span className="text-sm text-white">{username}</span>
          )}
        </Row>
        <Row label="Nome de exibição">
          {editing ? (
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          ) : (
            <span className="text-sm text-white">{displayName}</span>
          )}
        </Row>
        <Row label="E-mail">
          {editing ? (
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          ) : (
            <span className="text-sm text-white">{user.email || '—'}</span>
          )}
        </Row>
        <Row label="Número de telefone">
          <span className="text-sm text-discord-text-dim">
            {phone || 'Nenhum telefone cadastrado'}
          </span>
        </Row>

        <div className="pt-3 flex gap-2">
          {editing ? (
            <>
              <Button onClick={save}>Salvar</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Edit3 className="w-4 h-4 mr-1.5" />
              Editar
            </Button>
          )}
        </div>
      </Section>

      <Section title="Senha" description="Mude sua senha periodicamente pra manter a conta segura.">
        <Row label="Senha">
          <span className="text-sm text-discord-text-dim">••••••••••</span>
        </Row>
        <Button variant="secondary">
          <Lock className="w-4 h-4 mr-1.5" />
          Alterar senha
        </Button>
      </Section>

      <Section title="Autenticação em duas etapas" description="Adicione uma camada extra de segurança.">
        <Row label="Status">
          <span className="text-sm text-red-400">Desativado</span>
        </Row>
        <Button variant="secondary">
          <Shield className="w-4 h-4 mr-1.5" />
          Ativar 2FA
        </Button>
      </Section>

      <Section
        title="Remover conta"
        description="Isso vai apagar permanentemente sua conta e todos os dados."
        danger
      >
        <Button variant="danger">
          <Trash2 className="w-4 h-4 mr-1.5" />
          Excluir conta
        </Button>
      </Section>
    </div>
  )
}

// =============== SECTION: PERFIL ===============

function ProfileSection({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio ?? '')
  const [customStatus, setCustomStatus] = useState(user.customStatus ?? '')
  const [pronouns, setPronouns] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const supabase = createClient()

  const handleAvatar = async (file: File) => {
    setUploadingAvatar(true)
    try {
      // Delete old if storage path exists
      if (user.avatarUrl) {
        const old = extractStoragePath(user.avatarUrl, 'avatars')
        if (old) await deleteImage(old, 'avatars').catch(() => {})
      }
      const url = await uploadUserAvatar(user.id, file)
      await supabase.from('users').update({ avatar_url: url }).eq('id', user.id)
      updateProfile({ avatarUrl: url })
      toast.success('Foto atualizada')
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha no upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleBanner = async (file: File) => {
    setUploadingBanner(true)
    try {
      if (user.bannerUrl) {
        const old = extractStoragePath(user.bannerUrl, 'avatars')
        if (old) await deleteImage(old, 'avatars').catch(() => {})
      }
      const url = await uploadUserBanner(user.id, file)
      await supabase.from('users').update({ banner_url: url }).eq('id', user.id)
      updateProfile({ bannerUrl: url })
      toast.success('Banner atualizado')
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha no upload')
    } finally {
      setUploadingBanner(false)
    }
  }

  const save = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          bio,
          custom_status: customStatus || null,
          pronouns: pronouns || null,
        })
        .eq('id', user.id)
      if (error) throw error
      updateProfile({ displayName, bio, customStatus: customStatus || null })
      toast.success('Perfil salvo')
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao salvar')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Perfil</h2>
      <p className="text-sm text-discord-text-dim mb-6">
        Personalize como você aparece pra outras pessoas.
      </p>

      {/* Banner */}
      <Section title="Banner do perfil" description="Recomendado: 600x240 px, até 8MB.">
        <div className="relative h-32 rounded-lg overflow-hidden border border-discord-deep bg-discord-surface">
          {user.bannerUrl ? (
            <img src={user.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30" />
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer">
            <div className="opacity-0 hover:opacity-100 flex items-center gap-2 px-3 py-2 rounded-md bg-black/60 text-white text-sm">
              <Camera className="w-4 h-4" />
              {uploadingBanner ? 'Enviando...' : 'Trocar banner'}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingBanner}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleBanner(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </Section>

      {/* Avatar */}
      <Section title="Foto de perfil">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={user.avatarUrl} alt={displayName} size="xl" />
            <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 rounded-full transition-colors cursor-pointer">
              <Camera className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleAvatar(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          <div>
            <Button variant="secondary" disabled={uploadingAvatar}>
              <Camera className="w-4 h-4 mr-1.5" />
              {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
            </Button>
            <p className="text-xs text-discord-text-dim mt-2">PNG, JPG até 8MB</p>
          </div>
        </div>
      </Section>

      <Section title="Sobre você">
        <Row label="Nome de exibição">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Row>
        <Row label="Pronomes">
          <Input
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="ele/dele, ela/dela…"
          />
        </Row>
        <Row label="Status personalizado">
          <Input
            value={customStatus}
            onChange={(e) => setCustomStatus(e.target.value)}
            placeholder="Saindo pra almoçar"
            maxLength={128}
          />
        </Row>
        <Row label="Biografia" alignTop>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Conte um pouco sobre você..."
            maxLength={190}
          />
          <div className="text-right text-xs text-discord-text-dim mt-1">
            {bio.length}/190
          </div>
        </Row>
        <div className="pt-2">
          <Button onClick={save}>Salvar perfil</Button>
        </div>
      </Section>
    </div>
  )
}

// =============== SECTION: PRIVACIDADE ===============

function PrivacySection({ user: _ }: { user: User }) {
  const [allowDms, setAllowDms] = useState(true)
  const [allowFriendRequests, setAllowFriendRequests] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)
  const [allowCalls, setAllowCalls] = useState(true)
  const [showActivity, setShowActivity] = useState(true)
  const [safeDms, setSafeDms] = useState(true)

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Privacidade e segurança</h2>
      <p className="text-sm text-discord-text-dim mb-6">
        Controle quem pode mandar mensagem, ligar pra você, e o que aparece no seu status.
      </p>

      <Section title="Quem pode mandar mensagem pra você">
        <ToggleRow
          icon={<Mail className="w-4 h-4" />}
          label="Permitir mensagens diretas de membros do servidor"
          checked={allowDms}
          onChange={setAllowDms}
        />
        <ToggleRow
          icon={<UserIcon className="w-4 h-4" />}
          label="Aceitar pedidos de amizade"
          checked={allowFriendRequests}
          onChange={setAllowFriendRequests}
        />
        <ToggleRow
          icon={<Phone className="w-4 h-4" />}
          label="Permitir chamadas de voz e vídeo"
          checked={allowCalls}
          onChange={setAllowCalls}
        />
      </Section>

      <Section title="Atividade e status">
        <ToggleRow
          icon={<Eye className="w-4 h-4" />}
          label="Mostrar status online"
          checked={showActivity}
          onChange={setShowActivity}
        />
        <ToggleRow
          icon={<EyeOff className="w-4 h-4" />}
          label="Enviar confirmações de leitura"
          checked={readReceipts}
          onChange={setReadReceipts}
        />
      </Section>

      <Section title="Segurança das mensagens">
        <ToggleRow
          icon={<Shield className="w-4 h-4" />}
          label="Filtrar mensagens explícitas em DMs"
          checked={safeDms}
          onChange={setSafeDms}
        />
        <Row label="Bloqueios">
          <span className="text-sm text-discord-text-dim">Nenhum usuário bloqueado</span>
        </Row>
        <Button variant="secondary">Gerenciar bloqueios</Button>
      </Section>

      <Section title="Solicitações de dados" description="Exporte ou apague seus dados da RYVOLT.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-1.5" />
            Solicitar download dos dados
          </Button>
          <Button variant="danger">
            <Trash2 className="w-4 h-4 mr-1.5" />
            Solicitar exclusão dos dados
          </Button>
        </div>
      </Section>
    </div>
  )
}

// =============== SECTION: FAMÍLIA ===============

function FamilySection() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Família</h2>
      <p className="text-sm text-discord-text-dim mb-6">
        Central de controle familiar — em breve.
      </p>
      <Section title="Conta familiar">
        <Row label="Status">
          <span className="text-sm text-discord-text-dim">Você não faz parte de uma família</span>
        </Row>
        <Button variant="secondary" disabled>
          Criar família
        </Button>
      </Section>
    </div>
  )
}

// =============== SECTION: APARÊNCIA ===============

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const [accent, setAccent] = useState<'violet' | 'fuchsia' | 'cyan' | 'amber'>('violet')

  const accents: { id: typeof accent; label: string; cls: string }[] = [
    { id: 'violet', label: 'Violeta', cls: 'bg-violet-500' },
    { id: 'fuchsia', label: 'Fúcsia', cls: 'bg-fuchsia-500' },
    { id: 'cyan', label: 'Ciano', cls: 'bg-cyan-500' },
    { id: 'amber', label: 'Âmbar', cls: 'bg-amber-500' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Aparência</h2>
      <p className="text-sm text-discord-text-dim mb-6">Tema, cor de destaque e tamanho da fonte.</p>

      <Section title="Tema">
        <div className="grid grid-cols-3 gap-3">
          <ThemeOption
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
            icon={<Moon className="w-4 h-4" />}
            label="Escuro"
          />
          <ThemeOption
            active={theme === 'light'}
            onClick={() => setTheme('light')}
            icon={<Sun className="w-4 h-4" />}
            label="Claro"
          />
          <ThemeOption
            active={theme === 'system'}
            onClick={() => setTheme('system')}
            icon={<Monitor className="w-4 h-4" />}
            label="Sistema"
          />
        </div>
      </Section>

      <Section title="Cor de destaque">
        <div className="flex items-center gap-2">
          {accents.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white',
                a.cls,
                accent === a.id && 'ring-2 ring-offset-2 ring-offset-discord-bg ring-white'
              )}
              title={a.label}
            />
          ))}
        </div>
      </Section>

      <Section title="Compactação">
        <ToggleRow icon={<Sparkles className="w-4 h-4" />} label="Modo compacto" checked={false} onChange={() => {}} />
      </Section>
    </div>
  )
}

function ThemeOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
        active
          ? 'border-discord-blurple bg-discord-blurple/10'
          : 'border-discord-deep hover:border-discord-surface2'
      )}
    >
      <span className={active ? 'text-discord-blurple' : 'text-discord-text-dim'}>
        {icon}
      </span>
      <span className="text-sm text-white">{label}</span>
    </button>
  )
}

// =============== SECTION: VOZ E VÍDEO ===============

function VoiceSection() {
  const s = useMediaSettingsStore()
  const mics = useMediaDevices('audioinput')
  const speakers = useMediaDevices('audiooutput')
  const cameras = useMediaDevices('videoinput')

  const [testOpen, setTestOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAttenuation, setShowAttenuation] = useState(false)

  const isCustom = s.inputProfile === 'custom'

  const profileOptions: { id: InputProfile; title: string; description: string }[] = [
    {
      id: 'voice-isolation',
      title: 'Isolamento de Voz',
      description: 'Só a sua linda voz: deixa o RYVOLT equalizar o ruído',
    },
    {
      id: 'studio',
      title: 'Estúdio',
      description: 'Áudio puro: microfone aberto e sem processamento',
    },
    {
      id: 'custom',
      title: 'Personalizado',
      description: 'Modo avançado: me dê todos os botões e mostradores!',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">
        Voz e vídeo
      </h2>
      <p className="text-sm text-discord-text-dim mb-6">
        Configurações de áudio e vídeo pra chamadas. Tudo é salvo automaticamente.
      </p>

      {/* ==== Dispositivos ==== */}
      <Section title="Dispositivos">
        <Row label="Microfone">
          <select
            value={s.micDeviceId ?? ''}
            onChange={(e) => s.setMicDevice(e.target.value || null)}
            className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1.5 text-sm text-white min-w-[260px] max-w-full"
          >
            <option value="">Padrão do sistema</option>
            {mics.devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Volume do Microfone">
          <div className="flex items-center gap-3 w-full">
            <input
              type="range"
              min="0"
              max="200"
              value={Math.round(s.inputVolume * 100)}
              onChange={(e) => s.setInputVolume(Number(e.target.value) / 100)}
              className="flex-1 accent-discord-blurple"
            />
            <span className="text-xs font-mono text-discord-text-dim tabular-nums w-12 text-right">
              {Math.round(s.inputVolume * 100)}%
            </span>
          </div>
        </Row>

        <Row label="Alto-falante">
          <select
            value={s.speakerDeviceId ?? ''}
            onChange={(e) => s.setSpeakerDevice(e.target.value || null)}
            className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1.5 text-sm text-white min-w-[260px] max-w-full"
          >
            <option value="">Padrão do sistema</option>
            {speakers.devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Volume do Alto-falante">
          <div className="flex items-center gap-3 w-full">
            <input
              type="range"
              min="0"
              max="200"
              value={Math.round(s.outputVolume * 100)}
              onChange={(e) => s.setOutputVolume(Number(e.target.value) / 100)}
              className="flex-1 accent-discord-blurple"
            />
            <span className="text-xs font-mono text-discord-text-dim tabular-nums w-12 text-right">
              {Math.round(s.outputVolume * 100)}%
            </span>
          </div>
        </Row>

        <Row label="Câmera">
          <select
            value={s.cameraDeviceId ?? ''}
            onChange={(e) => s.setCameraDevice(e.target.value || null)}
            className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1.5 text-sm text-white min-w-[260px] max-w-full"
          >
            <option value="">Padrão do sistema</option>
            {cameras.devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </Row>

        <div className="px-4 py-4 border-t border-discord-deep">
          <button
            type="button"
            onClick={() => setTestOpen(true)}
            className="px-4 py-2 rounded-md bg-discord-blurple hover:bg-discord-blurple-hover text-white text-sm font-medium transition-colors"
          >
            Teste do microfone
          </button>
          <p className="text-xs text-discord-text-dim mt-2">
            Precisa de ajuda? Confira nosso{' '}
            <a className="text-discord-blurple hover:underline" href="#">
              guia de solução de problemas
            </a>
            .
          </p>
        </div>
      </Section>

      {/* ==== Perfil de entrada ==== */}
      <Section title="Perfil de entrada">
        <div className="px-4 py-3 space-y-1">
          {profileOptions.map((p) => (
            <label
              key={p.id}
              className="flex items-start gap-3 cursor-pointer py-2 px-2 rounded hover:bg-discord-hover"
            >
              <input
                type="radio"
                name="inputProfile"
                value={p.id}
                checked={s.inputProfile === p.id}
                onChange={() => s.setInputProfile(p.id)}
                className="mt-1 accent-discord-blurple"
              />
              <div>
                <div className="text-sm font-medium text-white">
                  {p.title}
                </div>
                <div className="text-xs text-discord-text-dim">
                  {p.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* ==== Sensibilidade automática + supressão de ruído ==== */}
      <Section title="Detecção de voz">
        <ToggleRow
          icon={<Activity className="w-4 h-4" />}
          label="Ajustar Automaticamente a Sensibilidade de Entrada"
          description="Controla quanto som o RYVOLT transmite do seu microfone."
          checked={s.autoGainControl}
          onChange={s.setAutoGainControl}
          disabled={!isCustom}
        />
        {s.autoGainControl && isCustom && (
          <div className="px-4 py-2 border-t border-discord-deep">
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(s.speakingThreshold * 100)}
              onChange={(e) => s.setSpeakingThreshold(Number(e.target.value) / 100)}
              className="w-full accent-green-500"
            />
          </div>
        )}

        <div className="px-4 py-3 border-t border-discord-deep">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium text-white">
                Supressão de ruído
              </div>
              <div className="text-xs text-discord-text-dim">
                Reduz o ruído de fundo do seu microfone.
              </div>
            </div>
            <select
              value={s.noiseSuppression ? 'krisp' : 'off'}
              onChange={(e) => s.setNoiseSuppression(e.target.value === 'krisp')}
              disabled={!isCustom}
              className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1.5 text-sm text-white min-w-[140px] disabled:opacity-50"
            >
              <option value="krisp">Krisp</option>
              <option value="off">Desligado</option>
            </select>
          </div>
        </div>

        <ToggleRow
          icon={<Volume2 className="w-4 h-4" />}
          label="Cancelamento de eco"
          description="Impede que o som dos alto-falantes volte pro microfone."
          checked={s.echoCancellation}
          onChange={s.setEchoCancellation}
          disabled={!isCustom}
        />

        <ToggleRow
          icon={<Headphones className="w-4 h-4" />}
          label="Apertar para Falar"
          description="O microfone só transmite enquanto uma tecla estiver pressionada."
          checked={s.pushToTalk}
          onChange={s.setPushToTalk}
        />
      </Section>

      {/* ==== Configurações avançadas (expansível) ==== */}
      <Section
        title={
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-discord-text-dim transition-transform',
                  showAdvanced ? 'rotate-0' : '-rotate-90',
                )}
              />
              <span>Mostrar Configurações de Voz Avançadas</span>
            </div>
          </button>
        }
        description="Controle automático do microfone, Detecção de voz avançada, Contornar sistema de processamento de entrada de áudio e mais"
      >
        {showAdvanced && (
          <div className="border-t border-discord-deep">
            <ToggleRow
              icon={<Activity className="w-4 h-4" />}
              label="Controle automático do microfone"
              description="Ajuste automaticamente o volume do microfone pra mantê-lo claro e consistente."
              checked={s.autoGainControl}
              onChange={s.setAutoGainControl}
              disabled={!isCustom}
            />
            <ToggleRow
              icon={<Mic className="w-4 h-4" />}
              label="Detecção de voz avançada"
              description="Desligar isso pode ajudar se sua voz não está sendo detectada pela sensibilidade automática de entrada."
              checked={s.advancedVoiceDetect}
              onChange={s.setAdvancedVoiceDetect}
              disabled={!isCustom}
            />
            <ToggleRow
              icon={<Volume2 className="w-4 h-4" />}
              label="Contornar sistema de processamento de entrada de áudio"
              description="O processamento de áudio do sistema pode interferir no processamento de áudio do RYVOLT."
              checked={s.bypassSystemProcessing}
              onChange={s.setBypassSystemProcessing}
              disabled={!isCustom}
            />
            <ToggleRow
              icon={<Volume2 className="w-4 h-4" />}
              label="Aviso de Áudio Não Detectado"
              description="Mostrar um aviso quando o RYVOLT não detectar o áudio do seu microfone."
              checked={s.noAudioNotify}
              onChange={s.setNoAudioNotify}
            />
            <ToggleRow
              icon={<Volume2 className="w-4 h-4" />}
              label="Aviso de Troca de Canal de Voz"
              description="Mostrar um aviso de confirmação antes de mudar pra um canal de voz diferente."
              checked={s.channelSwitchConfirm}
              onChange={s.setChannelSwitchConfirm}
            />
          </div>
        )}
      </Section>

      {/* ==== Atenuação (expansível) ==== */}
      <Section
        title={
          <button
            type="button"
            onClick={() => setShowAttenuation((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-discord-text-dim transition-transform',
                  showAttenuation ? 'rotate-0' : '-rotate-90',
                )}
              />
              <span>Atenuação geral</span>
            </div>
          </button>
        }
        description="Diminui o volume de outros aplicativos nesta porcentagem quando alguém estiver falando. Deixe em 0% pra desativar completamente a atenuação."
      >
        {showAttenuation && (
          <div className="border-t border-discord-deep space-y-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={s.attenuation}
                onChange={(e) => s.setAttenuation(Number(e.target.value))}
                className="flex-1 accent-discord-blurple"
              />
              <span className="text-xs font-mono text-discord-text-dim tabular-nums w-10 text-right">
                {s.attenuation}%
              </span>
            </div>
            <ToggleRow
              label="Quando eu falo"
              checked={s.attenuateWhenSelf}
              onChange={s.setAttenuateWhenSelf}
            />
            <ToggleRow
              label="Quando outros falam"
              checked={s.attenuateWhenOthers}
              onChange={s.setAttenuateWhenOthers}
            />
          </div>
        )}
      </Section>

      {/* ==== Qualidade de serviço ==== */}
      <Section title="Qualidade de serviço">
        <ToggleRow
          label="Qualidade de serviço"
          description="Informa ao roteador que os pacotes do RYVOLT são de alta prioridade. Alguns roteadores ou provedores de internet podem ficar de birra com isso ligado."
          checked={s.qosHighPriority}
          onChange={s.setQosHighPriority}
        />
      </Section>

      {/* ==== Qualidade do vídeo ==== */}
      <Section title="Qualidade do vídeo">
        <Row label="Resolução padrão">
          <select
            className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1.5 text-sm text-white"
            defaultValue="1080p"
          >
            <option>480p</option>
            <option>720p</option>
            <option>1080p</option>
            <option>1440p</option>
          </select>
        </Row>
        <Row label="FPS">
          <select
            className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1.5 text-sm text-white"
            defaultValue="60"
          >
            <option>15</option>
            <option>30</option>
            <option>60</option>
          </select>
        </Row>
      </Section>

      <MicTestModal open={testOpen} onClose={() => setTestOpen(false)} />
    </div>
  )
}

// =============== SECTION: NOTIFICAÇÕES ===============

function NotificationsSection() {
  const [desktop, setDesktop] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [unread, setUnread] = useState(true)
  const [mentions, setMentions] = useState(true)
  const [sounds, setSounds] = useState(true)

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Notificações</h2>
      <p className="text-sm text-discord-text-dim mb-6">
        Escolha como você quer ser avisado.
      </p>

      <Section title="Canais de notificação">
        <ToggleRow icon={<Monitor className="w-4 h-4" />} label="Ativar notificações desktop" checked={desktop} onChange={setDesktop} />
        <ToggleRow icon={<Smartphone className="w-4 h-4" />} label="Ativar notificações mobile" checked={mobile} onChange={setMobile} />
        <ToggleRow icon={<Volume2 className="w-4 h-4" />} label="Sons de notificação" checked={sounds} onChange={setSounds} />
      </Section>

      <Section title="Quando receber notificações">
        <ToggleRow icon={<Bell className="w-4 h-4" />} label="Toda mensagem" checked={unread} onChange={setUnread} />
        <ToggleRow icon={<UserIcon className="w-4 h-4" />} label="Apenas @menções" checked={mentions} onChange={setMentions} />
      </Section>

      <Section title="Modo não perturbe">
        <Row label="Horário">
          <span className="text-sm text-discord-text-dim">Desativado</span>
        </Row>
        <Button variant="secondary">Configurar horário</Button>
      </Section>
    </div>
  )
}

// =============== SECTION: KEYBINDS ===============

function KeybindsSection() {
  const binds = [
    { label: 'Silenciar microfone', key: 'Ctrl + Shift + M' },
    { label: 'Silenciar som', key: 'Ctrl + Shift + D' },
    { label: 'Sair da chamada', key: 'Ctrl + Shift + E' },
    { label: 'Mostrar lista de canais', key: 'Ctrl + K' },
    { label: 'Marcar canal como lido', key: 'Esc' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Keybinds</h2>
      <p className="text-sm text-discord-text-dim mb-6">Atalhos de teclado personalizáveis.</p>

      <Section title="Atalhos">
        {binds.map((b) => (
          <Row key={b.label} label={b.label}>
            <kbd className="px-2 py-1 text-xs rounded bg-discord-surface border border-discord-deep text-discord-text-muted font-mono">
              {b.key}
            </kbd>
          </Row>
        ))}
      </Section>
    </div>
  )
}

// =============== SECTION: IDIOMA ===============

function LanguageSection() {
  const langs = [
    { id: 'pt-BR', label: 'Português (Brasil)' },
    { id: 'en-US', label: 'English (US)' },
    { id: 'es-ES', label: 'Español' },
  ]
  const [lang, setLang] = useState('pt-BR')

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Idioma</h2>
      <p className="text-sm text-discord-text-dim mb-6">Mude o idioma da interface.</p>

      <Section title="Idioma">
        <div className="grid gap-2">
          {langs.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                lang === l.id
                  ? 'border-discord-blurple bg-discord-blurple/10'
                  : 'border-discord-deep hover:border-discord-surface2'
              )}
            >
              <span className="text-sm text-white">{l.label}</span>
              {lang === l.id && <span className="text-discord-blurple">✓</span>}
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}

// =============== SECTION: ACESSIBILIDADE ===============

function AccessibilitySection() {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [fontSize, setFontSize] = useState('100%')

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Acessibilidade</h2>
      <p className="text-sm text-discord-text-dim mb-6">
        Personalize o app pra atender suas necessidades.
      </p>

      <Section title="Visual">
        <ToggleRow
          icon={<Eye className="w-4 h-4" />}
          label="Reduzir movimento"
          checked={reduceMotion}
          onChange={setReduceMotion}
        />
        <ToggleRow
          icon={<EyeOff className="w-4 h-4" />}
          label="Alto contraste"
          checked={highContrast}
          onChange={setHighContrast}
        />
        <Row label="Tamanho da fonte">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-discord-surface border border-discord-deep rounded-md px-2 py-1 text-sm text-white"
          >
            <option>75%</option>
            <option>100%</option>
            <option>125%</option>
            <option>150%</option>
          </select>
        </Row>
      </Section>

      <Section title="Leitor de tela">
        <ToggleRow
          icon={<AccessibilityIcon className="w-4 h-4" />}
          label="Otimizar para leitores de tela"
          checked={screenReader}
          onChange={setScreenReader}
        />
      </Section>
    </div>
  )
}

// =============== SECTION: AVANÇADO ===============

function AdvancedSection() {
  const [hardware, setHardware] = useState(true)
  const [developer, setDeveloper] = useState(false)

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h2 className="text-2xl font-bold text-white mb-2">Avançado</h2>
      <p className="text-sm text-discord-text-dim mb-6">Opções pra usuários experientes.</p>

      <Section title="Desempenho">
        <ToggleRow
          icon={<Activity className="w-4 h-4" />}
          label="Aceleração de hardware"
          checked={hardware}
          onChange={setHardware}
        />
      </Section>

      <Section title="Desenvolvedor">
        <ToggleRow
          icon={<SettingsIcon className="w-4 h-4" />}
          label="Modo desenvolvedor"
          checked={developer}
          onChange={setDeveloper}
        />
      </Section>

      <Section title="Zona de perigo" danger>
        <p className="text-sm text-discord-text-dim mb-3">
          Ações irreversíveis. Faça com cuidado.
        </p>
        <Button variant="danger">
          <Trash2 className="w-4 h-4 mr-1.5" />
          Resetar todas as configurações
        </Button>
      </Section>
    </div>
  )
}

// =============== UI HELPERS ===============

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div
      className={cn(
        'mb-6 p-5 rounded-xl border bg-discord-surface',
        danger ? 'border-red-500/30' : 'border-discord-deep'
      )}
    >
      <div
        className={cn(
          'text-sm font-bold uppercase tracking-wide mb-1',
          danger ? 'text-red-400' : 'text-white'
        )}
      >
        {title}
      </div>
      {description && (
        <p className="text-xs text-discord-text-dim mb-4">{description}</p>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({
  label,
  children,
  alignTop,
}: {
  label: string
  children: React.ReactNode
  alignTop?: boolean
}) {
  return (
    <div className={cn('grid grid-cols-3 gap-4', alignTop && 'items-start')}>
      <div className="text-sm font-medium text-discord-text-muted pt-1">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon?: React.ReactNode
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && <span className="text-discord-text-dim mt-0.5">{icon}</span>}
        <div className="min-w-0">
          <div className={cn('text-sm', disabled ? 'text-discord-text-dim' : 'text-white')}>{label}</div>
          {description && (
            <div className="text-xs text-discord-text-dim mt-0.5">{description}</div>
          )}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}