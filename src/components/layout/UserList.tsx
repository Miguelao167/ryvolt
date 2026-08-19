'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, StatusBadge } from '@/components/ui'
import { SpeakingAvatar } from '@/components/voice/SpeakingAvatar'
import type { CommunityMember, User } from '@/types'

interface UserListProps {
  members: CommunityMember[]
  title?: string
}

export function UserList({ members, title = 'Members' }: UserListProps) {
  const onlineMembers = members.filter((m) => m.user?.status === 'online' || m.user?.status === 'idle' || m.user?.status === 'dnd')
  const offlineMembers = members.filter((m) => m.user?.status === 'offline')

  return (
    <div className="w-60 h-full bg-discord-surface overflow-y-auto">
      <div className="p-2">
        <UserListSection title={`ONLINE — ${onlineMembers.length}`} members={onlineMembers} />
        {offlineMembers.length > 0 && (
          <div className="mt-4">
            <UserListSection title={`OFFLINE — ${offlineMembers.length}`} members={offlineMembers} />
          </div>
        )}
      </div>
    </div>
  )
}

interface UserListSectionProps {
  title: string
  members: CommunityMember[]
}

function UserListSection({ title, members }: UserListSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 px-2 py-1">
        <ChevronDown className="w-3 h-3 text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {title}
        </span>
      </div>

      <div className="space-y-0.5">
        {members.map((member) => (
          <UserListItem key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}

interface UserListItemProps {
  member: CommunityMember
}

function UserListItem({ member }: UserListItemProps) {
  const { user, role, nickname } = member
  const displayName = nickname || user?.displayName || user?.username || 'Unknown'
  const roleColor = role?.color || '#6B7280'

  return (
    <motion.button
      whileHover={{ backgroundColor: 'rgba(79, 84, 92, 0.32)' }}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors"
    >
      <SpeakingAvatar
        userId={user?.id}
        src={user?.avatarUrl}
        alt={displayName}
        size="sm"
        status={user?.status}
        shape="circle"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-300 hover:text-white truncate">
            {displayName}
          </span>
          {role && role.name !== '@everyone' && (
            <span
              className="text-xs font-medium truncate"
              style={{ color: roleColor }}
            >
              {role.name}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}

// Compact version for DM panel
interface CompactUserListProps {
  users: User[]
  onSelectUser: (user: User) => void
  selectedUserId?: string
}

export function CompactUserList({ users, onSelectUser, selectedUserId }: CompactUserListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {users.map((user) => (
        <motion.button
          key={user.id}
          whileHover={{ backgroundColor: 'rgba(79, 84, 92, 0.32)' }}
          onClick={() => onSelectUser(user)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
            selectedUserId === user.id && 'bg-discord-hover'
          )}
        >
          <div className="relative">
            <SpeakingAvatar
              userId={user.id}
              src={user.avatarUrl}
              alt={user.displayName}
              size="md"
              status={user.status}
              shape="circle"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-300 truncate">
              {user.displayName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user.status === 'online' ? 'Online' : 'Offline'}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
