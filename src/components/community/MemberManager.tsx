'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Crown,
  Shield,
  MoreHorizontal,
  Ban,
  Clock,
  UserMinus,
  UserX,
  ChevronDown,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Avatar, Button, Badge, RoleBadge } from '@/components/ui'
import { formatPermissions } from '@/lib/permissions'
import type { CommunityMember, Role } from '@/types'

interface MemberManagerProps {
  members: CommunityMember[]
  roles: Role[]
  currentUserId: string
  onUpdateMember: (memberId: string, updates: Partial<CommunityMember>) => void
  onKickMember: (memberId: string) => void
  onBanMember: (memberId: string, reason?: string) => void
  onTimeoutMember: (memberId: string, duration: number) => void
}

export function MemberManager({
  members,
  roles,
  currentUserId,
  onUpdateMember,
  onKickMember,
  onBanMember,
  onTimeoutMember,
}: MemberManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [memberMenu, setMemberMenu] = useState<string | null>(null)

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !selectedRole || member.roleId === selectedRole
    return matchesSearch && matchesRole
  })

  const onlineMembers = filteredMembers.filter(
    (m) => m.user?.status === 'online' || m.user?.status === 'idle' || m.user?.status === 'dnd'
  )
  const offlineMembers = filteredMembers.filter((m) => m.user?.status === 'offline')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Members</h3>
          <p className="text-sm text-discord-text-dim">
            {members.length} members
          </p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-text-dim" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-discord-bg border border-discord-deep text-white placeholder:text-discord-text-dim focus:outline-none focus:border-discord-blurple"
          />
        </div>
        <select
          value={selectedRole || ''}
          onChange={(e) => setSelectedRole(e.target.value || null)}
          className="px-3 py-2 rounded-lg bg-discord-bg border border-discord-deep text-white focus:outline-none focus:border-discord-blurple"
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {/* Member sections */}
      <div className="space-y-6">
        {/* Online */}
        <MemberSection
          title={`Online — ${onlineMembers.length}`}
          members={onlineMembers}
          currentUserId={currentUserId}
          onMenuToggle={setMemberMenu}
          activeMenu={memberMenu}
          onKick={onKickMember}
          onBan={onBanMember}
          onTimeout={onTimeoutMember}
          onRoleChange={(memberId, roleId) => onUpdateMember(memberId, { roleId })}
          roles={roles}
        />

        {/* Offline */}
        <MemberSection
          title={`Offline — ${offlineMembers.length}`}
          members={offlineMembers}
          currentUserId={currentUserId}
          onMenuToggle={setMemberMenu}
          activeMenu={memberMenu}
          onKick={onKickMember}
          onBan={onBanMember}
          onTimeout={onTimeoutMember}
          onRoleChange={(memberId, roleId) => onUpdateMember(memberId, { roleId })}
          roles={roles}
        />
      </div>
    </div>
  )
}

interface MemberSectionProps {
  title: string
  members: CommunityMember[]
  currentUserId: string
  onMenuToggle: (memberId: string | null) => void
  activeMenu: string | null
  onKick: (memberId: string) => void
  onBan: (memberId: string, reason?: string) => void
  onTimeout: (memberId: string, duration: number) => void
  onRoleChange: (memberId: string, roleId: string) => void
  roles: Role[]
}

function MemberSection({
  title,
  members,
  currentUserId,
  onMenuToggle,
  activeMenu,
  onKick,
  onBan,
  onTimeout,
  onRoleChange,
  roles,
}: MemberSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ChevronDown className="w-4 h-4 text-discord-text-dim" />
        <span className="text-sm font-semibold text-discord-text-dim">{title}</span>
      </div>
      <div className="space-y-1">
        {members.map((member) => (
          <MemberItem
            key={member.id}
            member={member}
            currentUserId={currentUserId}
            onMenuToggle={onMenuToggle}
            activeMenu={activeMenu}
            onKick={onKick}
            onBan={onBan}
            onTimeout={onTimeout}
            onRoleChange={onRoleChange}
            roles={roles}
          />
        ))}
      </div>
    </div>
  )
}

interface MemberItemProps {
  member: CommunityMember
  currentUserId: string
  onMenuToggle: (memberId: string | null) => void
  activeMenu: string | null
  onKick: (memberId: string) => void
  onBan: (memberId: string, reason?: string) => void
  onTimeout: (memberId: string, duration: number) => void
  onRoleChange: (memberId: string, roleId: string) => void
  roles: Role[]
}

function MemberItem({
  member,
  currentUserId,
  onMenuToggle,
  activeMenu,
  onKick,
  onBan,
  onTimeout,
  onRoleChange,
  roles,
}: MemberItemProps) {
  const isCurrentUser = member.userId === currentUserId
  const isOwner = member.role?.name === 'Owner'

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-2 rounded-lg hover:bg-discord-hover transition-colors',
        isCurrentUser && 'bg-discord-hover'
      )}
    >
      <Avatar
        src={member.user?.avatarUrl}
        alt={member.user?.displayName || 'User'}
        size="md"
        status={member.user?.status}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">
            {member.nickname || member.user?.displayName}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-discord-text-dim">(you)</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-discord-text-dim">
          <span>@{member.user?.username}</span>
          {member.role && (
            <span style={{ color: member.role.color }}>
              • {member.role.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Role dropdown */}
        {!isCurrentUser && !isOwner && (
          <select
            value={member.roleId}
            onChange={(e) => onRoleChange(member.id, e.target.value)}
            className="px-2 py-1 rounded text-sm bg-discord-surface border border-discord-deep text-discord-text-muted focus:outline-none"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        )}

        {/* Actions menu */}
        {!isCurrentUser && !isOwner && (
          <div className="relative">
            <button
              onClick={() => onMenuToggle(activeMenu === member.id ? null : member.id)}
              className="p-1.5 rounded hover:bg-discord-deep"
            >
              <MoreHorizontal className="w-4 h-4 text-discord-text-dim" />
            </button>

            {activeMenu === member.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => onMenuToggle(null)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-discord-surface border border-discord-deep rounded-lg shadow-xl py-1 min-w-[160px]">
                  <button
                    onClick={() => {
                      onTimeout(member.id, 300)
                      onMenuToggle(null)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-discord-text-muted hover:bg-discord-hover flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Timeout 5 min
                  </button>
                  <button
                    onClick={() => {
                      onKick(member.id)
                      onMenuToggle(null)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-discord-yellow hover:bg-discord-hover flex items-center gap-2"
                  >
                    <UserMinus className="w-4 h-4" />
                    Kick
                  </button>
                  <button
                    onClick={() => {
                      onBan(member.id)
                      onMenuToggle(null)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-discord-red hover:bg-discord-hover flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Ban
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
