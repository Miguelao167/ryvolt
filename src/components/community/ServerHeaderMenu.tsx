'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Mail,
  Settings,
  Plus,
  PlusCircle,
  Calendar,
  Grid3x3,
  Bell,
  Shield,
  Edit3,
  EyeOff,
  ChevronUp,
  BadgeCheck,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InviteModal } from './InviteModal'
import type { Community } from '@/types'

interface ServerHeaderMenuProps {
  community: Community
  isOwner: boolean
  open: boolean
  onClose: () => void
  onInvite?: () => void
  onOpenSettings?: () => void
  onCreateChannel?: () => void
  onCreateCategory?: () => void
  onCreateEvent?: () => void
  onHideMuted?: () => void
  onEditProfile?: () => void
  onLeave?: () => void
}

export function ServerHeaderMenu({
  community,
  isOwner,
  open,
  onClose,
  onInvite,
  onOpenSettings,
  onCreateChannel,
  onCreateCategory,
  onCreateEvent,
  onHideMuted,
  onEditProfile,
  onLeave,
}: ServerHeaderMenuProps) {
  const [showNotifSub, setShowNotifSub] = useState(false)
  const [showPrivacySub, setShowPrivacySub] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [hideMutedChecked, setHideMutedChecked] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const subMenuClass =
    'absolute left-full top-0 ml-1 min-w-[220px] bg-discord-surface border border-discord-deep rounded-lg shadow-2xl py-1.5 z-50'

  const handleAction = (fn?: () => void) => () => {
    fn?.()
    onClose()
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.1 }}
          className="absolute left-2 right-2 top-full mt-1 z-50 min-w-[220px] bg-discord-surface border border-discord-deep rounded-lg shadow-2xl py-1.5 text-sm"
        >
          {/* ───── Seu servidor ───── */}
          {isOwner && (
            <>
              <Item icon={<Zap className="w-4 h-4" />} onClick={handleAction()}>
                Impulso de servidor
              </Item>
              <Item
                icon={<Mail className="w-4 h-4" />}
                onClick={() => {
                  setShowInviteModal(true)
                  onClose()
                }}
              >
                Convidar para o servidor
              </Item>
              <Item
                icon={<Settings className="w-4 h-4" />}
                onClick={handleAction(onOpenSettings)}
              >
                Config. do servidor
              </Item>
              <Item
                icon={<Plus className="w-4 h-4" />}
                onClick={handleAction(onCreateChannel)}
              >
                Criar canal
              </Item>
              <Item
                icon={<PlusCircle className="w-4 h-4" />}
                onClick={handleAction(onCreateCategory)}
              >
                Criar categoria
              </Item>
              <Item
                icon={<Calendar className="w-4 h-4" />}
                onClick={handleAction(onCreateEvent)}
              >
                Criar evento
              </Item>
              <Item icon={<Grid3x3 className="w-4 h-4" />} onClick={handleAction()}>
                Diretório de Apps
              </Item>

              <Divider />
            </>
          )}

          {/* ───── Servidor de outra pessoa ───── */}
          {!isOwner && (
            <>
              <Item
                icon={<Mail className="w-4 h-4" />}
                onClick={() => {
                  setShowInviteModal(true)
                  onClose()
                }}
              >
                Convidar para o servidor
              </Item>
              <Item
                icon={<Calendar className="w-4 h-4" />}
                onClick={handleAction(onCreateEvent)}
              >
                Criar evento
              </Item>

              <Divider />
            </>
          )}

          {/* ───── Comuns ───── */}
          <div
            className="relative"
            onMouseEnter={() => {
              setShowNotifSub(true)
              setShowPrivacySub(false)
            }}
          >
            <Item
              icon={<Bell className="w-4 h-4" />}
              rightIcon={<ChevronUp className="w-4 h-4 -rotate-90" />}
              onClick={() => setShowNotifSub((v) => !v)}
              active={showNotifSub}
            >
              Config. de notificação
            </Item>
            <AnimatePresence>
              {showNotifSub && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.08 }}
                  className={subMenuClass}
                >
                  <RadioItem label="Todas as mensagens" onClick={onClose} />
                  <RadioItem label="Apenas @menções" selected onClick={onClose} />
                  <RadioItem label="Nada" onClick={onClose} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="relative"
            onMouseEnter={() => {
              setShowPrivacySub(true)
              setShowNotifSub(false)
            }}
          >
            <Item
              icon={<Shield className="w-4 h-4" />}
              rightIcon={<ChevronUp className="w-4 h-4 -rotate-90" />}
              onClick={() => setShowPrivacySub((v) => !v)}
              active={showPrivacySub}
            >
              Config. de privacidade
            </Item>
            <AnimatePresence>
              {showPrivacySub && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.08 }}
                  className={subMenuClass}
                >
                  <SubItem onClick={onClose}>Permitir DMs de membros</SubItem>
                  <SubItem onClick={onClose}>Ocultar minha presença</SubItem>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isOwner && (
            <Item
              icon={<Edit3 className="w-4 h-4" />}
              onClick={handleAction(onEditProfile)}
            >
              Editar perfil por servidor
            </Item>
          )}

          <CheckItem
            icon={<EyeOff className="w-4 h-4" />}
            label="Ocultar canais silenciados"
            selected={hideMutedChecked}
            onClick={() => {
              setHideMutedChecked((v) => !v)
              onHideMuted?.()
            }}
          />

          {!isOwner && (
            <>
              <Divider />
              <Item
                icon={<LogOut className="w-4 h-4" />}
                danger
                onClick={handleAction(onLeave)}
              >
                Sair do servidor
              </Item>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {showInviteModal && (
        <InviteModal
          communityId={community.id}
          communityName={community.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  )
}

interface ItemProps {
  icon: React.ReactNode
  rightIcon?: React.ReactNode
  danger?: boolean
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function Item({ icon, rightIcon, danger, active, onClick, children }: ItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
        'hover:bg-discord-blurple hover:text-white',
        active && 'bg-discord-hover',
        danger ? 'text-red-400 hover:bg-red-500 hover:text-white' : 'text-white'
      )}
    >
      <span className="flex-shrink-0 text-discord-text-muted">{icon}</span>
      <span className="flex-1 truncate">{children}</span>
      {rightIcon && (
        <span className="flex-shrink-0 text-discord-text-dim">{rightIcon}</span>
      )}
    </button>
  )
}

function SubItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-3 py-1.5 text-left text-white hover:bg-discord-blurple hover:text-white transition-colors"
    >
      {children}
    </button>
  )
}

interface CheckItemProps {
  icon?: React.ReactNode
  label: string
  selected?: boolean
  onClick?: () => void
}

function CheckItem({ icon, label, selected, onClick }: CheckItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-white hover:bg-discord-blurple hover:text-white transition-colors"
    >
      {icon ?? <span className="w-4 h-4" />}
      <span className="flex-1 truncate">{label}</span>
      <span className="w-4 h-4 flex items-center justify-center">
        {selected && <BadgeCheck className="w-4 h-4 text-discord-blurple" />}
      </span>
    </button>
  )
}

interface RadioItemProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

function RadioItem({ label, selected, onClick }: RadioItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-white hover:bg-discord-blurple hover:text-white transition-colors"
    >
      <span className="w-4 h-4 rounded-full border-2 border-discord-text-dim flex items-center justify-center">
        {selected && <span className="w-2 h-2 rounded-full bg-discord-blurple" />}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-discord-deep" />
}
