'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Copy,
  Check,
  Clock,
  Users,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'
import type { Invite } from '@/types'

interface InviteManagerProps {
  invites: Invite[]
  communityName: string
  onCreateInvite: (invite: Partial<Invite>) => void
  onDeleteInvite: (inviteId: string) => void
  onCopyInvite: (code: string) => void
}

export function InviteManager({
  invites,
  communityName,
  onCreateInvite,
  onDeleteInvite,
  onCopyInvite,
}: InviteManagerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      await onCreateInvite({ max_uses: null, expires_at: null })
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = (invite: Invite) => {
    const url = `${window.location.origin}/invite/${invite.code}`
    navigator.clipboard.writeText(url)
    setCopiedId(invite.id)
    onCopyInvite(invite.code)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Invites</h3>
          <p className="text-sm text-discord-text-dim">
            Create and manage invite links for {communityName}
          </p>
        </div>
        <Button onClick={handleCreate} isLoading={creating}>
          <RefreshCw className="w-4 h-4" />
          Generate Invite
        </Button>
      </div>

      {/* Invite list */}
      <div className="space-y-3">
        {invites.map((invite) => (
          <InviteItem
            key={invite.id}
            invite={invite}
            onCopy={() => handleCopy(invite)}
            onDelete={() => onDeleteInvite(invite.id)}
            copied={copiedId === invite.id}
          />
        ))}

        {invites.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-discord-text-dim mb-4" />
            <p className="text-discord-text-muted">No invite links yet</p>
            <p className="text-sm text-discord-text-dim">
              Generate an invite link to share with others
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface InviteItemProps {
  invite: Invite
  onCopy: () => void
  onDelete: () => void
  copied: boolean
}

function InviteItem({ invite, onCopy, onDelete, copied }: InviteItemProps) {
  const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date()
  const isMaxed = invite.max_uses && invite.uses >= invite.max_uses
  const isActive = !isExpired && !isMaxed

  return (
    <motion.div
      layout
      className="p-4 rounded-xl bg-discord-surface border border-discord-deep"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <code className="px-2 py-1 rounded bg-discord-hover font-mono text-sm text-white">
              ryvolt.com/invite/{invite.code}
            </code>
            {copied ? (
              <Badge variant="success">
                <Check className="w-3 h-3" />
                Copied!
              </Badge>
            ) : (
              <Badge variant={isActive ? 'default' : 'error'}>
                {isExpired && 'Expired'}
                {isMaxed && 'Max uses reached'}
                {isActive && !invite.expires_at && !invite.max_uses && 'Active'}
                {isActive && invite.expires_at && (
                  <>
                    <Clock className="w-3 h-3" />
                    Expires {formatDate(invite.expires_at)}
                  </>
                )}
                {isActive && !invite.expires_at && invite.max_uses && (
                  <>
                    <Users className="w-3 h-3" />
                    {invite.uses}/{invite.max_uses} uses
                  </>
                )}
              </Badge>
            )}
          </div>
          <p className="text-sm text-discord-text-dim">
            Created {formatDate(invite.created_at)} • {invite.uses} uses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCopy}
            disabled={!isActive}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Invite preview page component
interface InvitePreviewProps {
  community: {
    name: string
    description: string | null
    icon_url: string | null
    member_count: number
    online_count: number
  }
  onJoin: () => void
  isAuthenticated: boolean
}

export function InvitePreview({ community, onJoin, isAuthenticated }: InvitePreviewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-discord-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 text-center">
          {/* Community icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-discord-blurple to-discord-green flex items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {community.name[0].toUpperCase()}
            </span>
          </div>

          {/* Community info */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {community.name}
          </h1>
          {community.description && (
            <p className="text-discord-text-muted mb-4">
              {community.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {community.member_count.toLocaleString()}
              </div>
              <div className="text-xs text-discord-text-dim">Members</div>
            </div>
            <div className="w-px h-8 bg-discord-deep" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-discord-green" />
                <span className="text-2xl font-bold text-white">
                  {community.online_count}
                </span>
              </div>
              <div className="text-xs text-discord-text-dim">Online</div>
            </div>
          </div>

          {/* Join button */}
          <Button size="lg" className="w-full" onClick={onJoin}>
            {isAuthenticated ? 'Join Community' : 'Sign in to Join'}
          </Button>

          {!isAuthenticated && (
            <p className="mt-4 text-sm text-discord-text-dim">
              You&apos;ll need to create an account to join
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
