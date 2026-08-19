'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  Shield,
  Mic,
  Headphones,
  Volume2,
  Video,
  PhoneOff,
  Activity,
  Sparkles,
  Monitor,
  Camera,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Avatar, Tooltip } from '@/components/ui'
import { SpeakingAvatar } from '@/components/voice/SpeakingAvatar'
import { ScreenShareModal } from '@/components/voice/ScreenShareModal'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useAuthStore } from '@/stores/authStore'
import { useVoiceStore } from '@/stores/voiceStore'
import { useCommunityStore } from '@/stores/communityStore'
import { uploadUserAvatar } from '@/lib/supabase/upload'
import type { User as UserType, UserStatus } from '@/types'

interface UserPanelProps {
  user: UserType
  onLogout: () => void
  onOpenProfile?: () => void
  onOpenSettings?: (tab?: 'account' | 'profile' | 'privacy' | 'family' | 'appearance' | 'voice' | 'notifications' | 'keybinds' | 'language' | 'accessibility' | 'advanced') => void
}

export function UserPanel({ user, onLogout, onOpenProfile, onOpenSettings }: UserPanelProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const updateStatus = useAuthStore((s) => s.updateStatus)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  // Voice connection state
  const activeChannelId = useVoiceStore((s) => s.activeChannelId)
  const leaveVoice = useVoiceStore((s) => s.leave)
  const allChannels = useCommunityStore((s) => s.channels)
  const activeChannelName = activeChannelId
    ? allChannels.find((c) => c.id === activeChannelId)?.name
    : null

  const [micMuted, setMicMuted] = useState(false)
  const [deafened, setDeafened] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [screenOpen, setScreenOpen] = useState(false)
  const isStreaming = useVoiceStore((s) => s.isStreaming)

  const statusOptions: { status: UserStatus; label: string; icon: string; description: string }[] = [
    { status: 'online', label: 'Online', icon: '🟢', description: 'Aparecer como disponível' },
    { status: 'idle', label: 'Ausente', icon: '🌙', description: 'Mostrar que você está longe' },
    { status: 'dnd', label: 'Não perturbe', icon: '🔴', description: 'Silenciar notificações' },
    { status: 'offline', label: 'Invisível', icon: '⚫', description: 'Aparecer offline para os outros' },
  ]

  const currentStatus = statusOptions.find((s) => s.status === user.status)

  const handleAvatarChange = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const url = await uploadUserAvatar(user.id, file)
      updateProfile({ avatarUrl: url })
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('users').update({ avatar_url: url }).eq('id', user.id)
      toast.success('Foto atualizada')
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha no upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="relative">
      {/* ───── Faixa de voz ativa - Discord style ───── */}
      {activeChannelId && (
        <div className="mb-1 rounded-lg bg-discord-deep overflow-hidden">
          {/* Header: status + ações rápidas */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="w-2 h-2 rounded-full bg-discord-green animate-pulse" />
              <span className="text-xs font-semibold text-discord-green truncate">
                Voz conectada
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip content={micMuted ? 'Ativar mic' : 'Silenciar mic'}>
                <button
                  onClick={() => setMicMuted((m) => !m)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    micMuted
                      ? 'bg-discord-red/20 text-discord-red hover:bg-discord-red/30'
                      : 'text-gray-400 hover:bg-discord-hover hover:text-white'
                  )}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </Tooltip>
              <Tooltip content={deafened ? 'Ativar som' : 'Silenciar som'}>
                <button
                  onClick={() => setDeafened((d) => !d)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    deafened
                      ? 'bg-discord-red/20 text-discord-red hover:bg-discord-red/30'
                      : 'text-gray-400 hover:bg-discord-hover hover:text-white'
                  )}
                >
                  {deafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                </button>
              </Tooltip>
              <Tooltip content="Desligar chamada">
                <button
                  onClick={() => leaveVoice()}
                  className="p-1.5 rounded bg-discord-red/20 text-discord-red hover:bg-discord-red hover:text-white transition-colors"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Canal atual + toggle de ações extras */}
          <button
            onClick={() => setShowExtra((s) => !s)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-discord-deep"
          >
            <span className="truncate">
              Em <span className="font-medium text-white">{activeChannelName}</span>
            </span>
            <motion.div animate={{ rotate: showExtra ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </button>

          {/* Ações extras estilo Discord */}
          <AnimatePresence>
            {showExtra && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-1 p-1.5">
                  <ExtraButton icon={Video} label="Câmera" />
                  <ExtraButton
                    icon={Monitor}
                    label={isStreaming ? 'Transmitindo' : 'Tela'}
                    onClick={() => setScreenOpen(true)}
                    active={isStreaming}
                  />
                  <ExtraButton icon={Activity} label="Atividade" />
                  <ExtraButton icon={Sparkles} label="Efeitos" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ───── User button (compacto) - Discord style ───── */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-discord-deep hover:bg-discord-surface transition-colors cursor-pointer"
      >
        <div className="relative shrink-0">
          <SpeakingAvatar
            userId={user.id}
            src={user.avatarUrl}
            alt={user.displayName}
            size="sm"
            status={user.status}
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold text-white truncate leading-tight">
            {user.displayName}
          </div>
          <div className="text-[10px] text-gray-400 truncate leading-tight">
            #{user.username}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip content="Silenciar mic">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMicMuted((m) => !m)
              }}
              className={cn(
                'p-1.5 rounded transition-colors',
                micMuted
                  ? 'text-discord-red'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </Tooltip>
          <Tooltip content={deafened ? 'Ativar som' : 'Silenciar som'}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setDeafened((d) => !d)
              }}
              className={cn(
                'p-1.5 rounded transition-colors',
                deafened
                  ? 'text-discord-red'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {deafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
            </button>
          </Tooltip>
          <Tooltip content="Configurações">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen((o) => !o)
              }}
              className="p-1.5 rounded text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </motion.div>

      {/* ───── Dropdown panel - Discord style ───── */}
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-discord-darker rounded-xl shadow-2xl overflow-hidden w-72"
          >
            {/* User info */}
            <div className="p-4 border-b border-black/30">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <SpeakingAvatar
                    userId={user.id}
                    src={user.avatarUrl}
                    alt={user.displayName}
                    size="xl"
                  />
                  <label
                    className={cn(
                      'absolute inset-0 rounded-full flex items-center justify-center bg-black/50 transition-opacity cursor-pointer',
                      uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                  >
                    {uploadingAvatar ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleAvatarChange(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">
                    {user.displayName}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (ev) => {
                        const f = (ev.target as HTMLInputElement).files?.[0]
                        if (f) handleAvatarChange(f)
                      }
                      input.click()
                    }}
                    className="text-xs text-blue-500 hover:underline mt-1"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status selector */}
            <div className="p-2 border-b border-black/30">
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-discord-surface2"
                >
                  <span>{currentStatus?.icon}</span>
                  <span className="text-sm text-gray-300">
                    {currentStatus?.label}
                  </span>
                </button>

                {showStatusMenu && (
                  <div className="absolute bottom-full left-0 mb-1 w-full bg-discord-darker rounded-lg shadow-2xl overflow-hidden">
                    {statusOptions.map((option) => (
                      <button
                        key={option.status}
                        onClick={() => {
                          updateStatus(option.status)
                          setShowStatusMenu(false)
                        }}
                        className={cn(
                          'w-full flex items-start gap-2 px-3 py-2 hover:bg-discord-surface2 text-left transition-colors',
                          user.status === option.status && 'bg-discord-surface2'
                        )}
                      >
                        <span className="mt-0.5">{option.icon}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-gray-200">
                            {option.label}
                          </span>
                          <span className="block text-[11px] text-gray-400 leading-snug">
                            {option.description}
                          </span>
                        </span>
                        {user.status === option.status && (
                          <span className="text-xs text-discord-green">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <MenuItem
                icon={<User className="w-4 h-4" />}
                label="Perfil"
                onClick={() => {
                  setIsOpen(false)
                  onOpenProfile?.()
                }}
              />
              <MenuItem
                icon={<Settings className="w-4 h-4" />}
                label="Configurações"
                onClick={() => {
                  setIsOpen(false)
                  onOpenSettings?.('account')
                }}
              />
              <MenuItem
                icon={<Shield className="w-4 h-4" />}
                label="Privacidade e segurança"
                onClick={() => {
                  setIsOpen(false)
                  onOpenSettings?.('privacy')
                }}
              />

              <div className="my-2 h-px bg-black/30" />

              <MenuItem
                icon={resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                label={resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              />

              <div className="my-2 h-px bg-black/30" />

              <MenuItem icon={<LogOut className="w-4 h-4" />} label="Sair" onClick={onLogout} danger />
            </div>
          </motion.div>
        </>
      )}

      <ScreenShareModal open={screenOpen} onClose={() => setScreenOpen(false)} />
    </div>
  )
}

function ExtraButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
        active
          ? 'bg-discord-green/15 text-discord-green hover:bg-discord-green/25'
          : 'text-gray-300 hover:bg-discord-deep hover:text-white',
      )}
      title={label}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px]">{label}</span>
    </button>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-discord-surface2 transition-colors',
        danger && 'text-discord-red'
      )}
    >
      <span className={cn(danger ? 'text-discord-red' : 'text-gray-300')}>{icon}</span>
      <span className={cn('text-sm', danger ? 'text-discord-red' : 'text-gray-200')}>
        {label}
      </span>
    </button>
  )
}

// Local icon helpers
function MicOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A4.63 4.63 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V4a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function VolumeX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" x2="16" y1="9" y2="15" />
      <line x1="16" x2="22" y1="9" y2="15" />
    </svg>
  )
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
