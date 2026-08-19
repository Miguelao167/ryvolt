'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Hash,
  Shield,
  Settings,
  Bell,
  UserPlus,
  Crown,
  Plus,
  ChevronRight,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Community } from '@/types'

type TabType = 'overview' | 'channels' | 'members' | 'roles' | 'invites' | 'settings' | 'moderation'

interface CommunitySettingsSidebarProps {
  community: Community
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'channels', label: 'Channels', icon: Hash },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'invites', label: 'Invites', icon: UserPlus },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export function CommunitySettingsSidebar({
  community,
  activeTab,
  onTabChange,
}: CommunitySettingsSidebarProps) {
  return (
    <div className="w-60 h-full bg-discord-surface border-r border-discord-deep flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-discord-deep">
        <button
          onClick={() => onTabChange('overview')}
          className="flex items-center gap-2 text-lg font-semibold text-white hover:opacity-80"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          {community.name}
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors mb-1',
              activeTab === tab.id
                ? 'bg-discord-hover text-white'
                : 'text-discord-text-muted hover:bg-discord-hover hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-discord-deep">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-discord-hover">
          <Crown className="w-4 h-4 text-discord-yellow" />
          <span className="text-sm text-discord-text-muted">Owner</span>
        </div>
      </div>
    </div>
  )
}

// Settings panels
interface SettingsPanelProps {
  children: React.ReactNode
}

export function SettingsPanel({ children }: SettingsPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-sm text-discord-text-dim mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
