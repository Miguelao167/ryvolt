'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronRight,
  EyeOff,
  Mail,
  Bell,
  BellOff,
  Shield,
  Edit3,
  LogOut,
  CheckCheck,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InviteModal } from './InviteModal'
import type { Community } from '@/types'

interface CommunityContextMenuProps {
  community: Community
  position: { x: number; y: number }
  isOwner: boolean
  onClose: () => void
  onLeave: (communityId: string) => void
}

export function CommunityContextMenu({
  community,
  position,
  isOwner,
  onClose,
  onLeave,
}: CommunityContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [showMuteSub, setShowMuteSub] = useState(false)
  const [showNotifSub, setShowNotifSub] = useState(false)
  const [showPrivacySub, setShowPrivacySub] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const [adjusted, setAdjusted] = useState(position)
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    let x = position.x
    let y = position.y
    if (x + rect.width > window.innerWidth - 8) {
      x = window.innerWidth - rect.width - 8
    }
    if (y + rect.height > window.innerHeight - 8) {
      y = window.innerHeight - rect.height - 8
    }
    setAdjusted({ x, y })
  }, [position.x, position.y])

  useEffect(() => {
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
  }, [onClose])

  const subMenuClass =
    'absolute left-full top-0 ml-1 min-w-[220px] bg-discord-surface border border-discord-deep rounded-lg shadow-2xl py-1.5 z-50'

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.1 }}
          style={{ left: adjusted.x, top: adjusted.y }}
          className="fixed z-50 min-w-[240px] bg-discord-surface border border-discord-deep rounded-lg shadow-2xl py-1.5 text-sm"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Item icon={<CheckCheck className="w-4 h-4" />} onClick={onClose}>
            Marcar como lida
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

          <div
            className="relative"
            onMouseEnter={() => {
              setShowMuteSub(true)
              setShowNotifSub(false)
              setShowPrivacySub(false)
            }}
          >
            <Item
              icon={<BellOff className="w-4 h-4" />}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => setShowMuteSub((v) => !v)}
              active={showMuteSub}
            >
              Silenciar servidor
            </Item>
            <AnimatePresence>
              {showMuteSub && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.08 }}
                  className={subMenuClass}
                >
                  <SubItem onClick={onClose}>Por 15 minutos</SubItem>
                  <SubItem onClick={onClose}>Por 1 hora</SubItem>
                  <SubItem onClick={onClose}>Por 3 horas</SubItem>
                  <SubItem onClick={onClose}>Por 8 horas</SubItem>
                  <SubItem onClick={onClose}>Por 24 horas</SubItem>
                  <SubItem onClick={onClose}>Até eu ligar de novo</SubItem>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="relative"
            onMouseEnter={() => {
              setShowNotifSub(true)
              setShowMuteSub(false)
              setShowPrivacySub(false)
            }}
          >
            <Item
              icon={<Bell className="w-4 h-4" />}
              label="Apenas @menções"
              rightIcon={<ChevronRight className="w-4 h-4" />}
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
                  <RadioItem label="Todas as mensagens" selected={false} onClick={onClose} />
                  <RadioItem label="Apenas @menções" selected onClick={onClose} />
                  <RadioItem label="Nada" selected={false} onClick={onClose} />
                  <Divider />
                  <CheckItem label="Silenciar @everyone e @here" onClick={onClose} />
                  <CheckItem label="Silenciar todas as @menções de cargos" onClick={onClose} />
                  <CheckItem label="Desativar Destaques" onClick={onClose} />
                  <CheckItem label="Silenciar novos eventos" onClick={onClose} />
                  <Divider />
                  <CheckItem label="Notificar em dispositivos móveis" selected onClick={onClose} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <CheckItem
            icon={<EyeOff className="w-4 h-4" />}
            label="Ocultar canais silenciados"
            onClick={onClose}
          />

          <CheckItem
            icon={<Eye className="w-4 h-4" />}
            label="Mostrar todos os canais"
            selected
            onClick={onClose}
          />

          <Divider />

          <div
            className="relative"
            onMouseEnter={() => {
              setShowPrivacySub(true)
              setShowMuteSub(false)
              setShowNotifSub(false)
            }}
          >
            <Item
              icon={<Shield className="w-4 h-4" />}
              rightIcon={<ChevronRight className="w-4 h-4" />}
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
                  <SubItem onClick={onClose}>Permitir DMs de membros do servidor</SubItem>
                  <SubItem onClick={onClose}>Ocultar minha presença</SubItem>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isOwner && (
            <Item icon={<Edit3 className="w-4 h-4" />} onClick={onClose}>
              Editar perfil por servidor
            </Item>
          )}

          <Divider />

          <Item
            icon={<LogOut className="w-4 h-4" />}
            danger
            onClick={() => {
              onLeave(community.id)
              onClose()
            }}
          >
            Sair do servidor
          </Item>
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
  label?: string
  rightIcon?: React.ReactNode
  danger?: boolean
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function Item({ icon, label, rightIcon, danger, active, onClick, children }: ItemProps) {
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
      <span className="flex-shrink-0 text-discord-text-muted">
        {icon}
      </span>
      <span className="flex-1 truncate">{children}</span>
      {label && (
        <span className="text-xs text-discord-text-dim truncate max-w-[90px]">
          {label}
        </span>
      )}
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
      <span className="flex-1">{label}</span>
      <span className="w-4 h-4 flex items-center justify-center">
        {selected && <Check className="w-4 h-4 text-discord-blurple" />}
      </span>
    </button>
  )
}

interface RadioItemProps {
  label: string
  selected: boolean
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
