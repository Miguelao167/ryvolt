'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-discord-hover text-discord-text-muted',
    primary: 'bg-discord-blurple/20 text-discord-blurple',
    success: 'bg-discord-green/20 text-discord-green',
    warning: 'bg-discord-yellow/20 text-discord-yellow',
    error: 'bg-discord-red/20 text-discord-red',
    outline: 'bg-transparent border border-discord-deep text-discord-text-muted',
  }

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

interface RoleBadgeProps {
  name: string
  color: string
  size?: 'sm' | 'md'
  className?: string
}

export function RoleBadge({ name, color, size = 'sm', className }: RoleBadgeProps) {
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {name}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'online' | 'idle' | 'dnd' | 'offline'
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig = {
  online: { label: 'Online', color: '#10B981' },
  idle: { label: 'Idle', color: '#F59E0B' },
  dnd: { label: 'Do Not Disturb', color: '#EF4444' },
  offline: { label: 'Offline', color: '#6B7280' },
}

export function StatusBadge({ status, showLabel = false, size = 'sm', className }: StatusBadgeProps) {
  const { label, color } = statusConfig[status]
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('rounded-full', dotSize)}
        style={{ backgroundColor: color }}
      />
      {showLabel && (
        <span className="text-xs text-discord-text-muted">{label}</span>
      )}
    </span>
  )
}
