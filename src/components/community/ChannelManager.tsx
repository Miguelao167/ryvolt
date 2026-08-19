'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Hash,
  Volume2,
  Video,
  Plus,
  Settings,
  Trash2,
  GripVertical,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui'
import type { Channel, ChannelType } from '@/types'

interface ChannelManagerProps {
  channels: Channel[]
  onCreateChannel: (channel: Partial<Channel>) => void
  onUpdateChannel: (channelId: string, updates: Partial<Channel>) => void
  onDeleteChannel: (channelId: string) => void
}

export function ChannelManager({
  channels,
  onCreateChannel,
  onUpdateChannel,
  onDeleteChannel,
}: ChannelManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'text' as ChannelType,
    category: '',
  })

  // Group channels by category
  const categories = channels.reduce((acc, channel) => {
    const category = channel.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(channel)
    return acc
  }, {} as Record<string, Channel[]>)

  const handleCreate = () => {
    if (!newChannel.name.trim()) return
    onCreateChannel(newChannel)
    setNewChannel({ name: '', type: 'text', category: '' })
    setShowCreateModal(false)
  }

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case 'voice':
        return <Volume2 className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      default:
        return <Hash className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Channels</h3>
          <p className="text-sm text-discord-text-dim">Create and manage your community channels</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Channel
        </Button>
      </div>

      {/* Channel list */}
      <div className="space-y-6">
        {Object.entries(categories).map(([category, categoryChannels]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown className="w-4 h-4 text-discord-text-dim" />
              <span className="text-sm font-semibold uppercase text-discord-text-dim">
                {category}
              </span>
            </div>

            <div className="space-y-1">
              {categoryChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  onEdit={() => setEditingChannel(channel)}
                  onDelete={() => onDeleteChannel(channel.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(categories).length === 0 && (
          <div className="text-center py-12">
            <Hash className="w-12 h-12 mx-auto text-discord-text-dim mb-4" />
            <p className="text-discord-text-muted">No channels yet</p>
            <p className="text-sm text-discord-text-dim">Create your first channel to get started</p>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        value={newChannel}
        onChange={setNewChannel}
        onSubmit={handleCreate}
      />

      {/* Edit Channel Modal */}
      {editingChannel && (
        <EditChannelModal
          open={!!editingChannel}
          onClose={() => setEditingChannel(null)}
          channel={editingChannel}
          onSave={(updates) => {
            onUpdateChannel(editingChannel.id, updates)
            setEditingChannel(null)
          }}
          onDelete={() => {
            onDeleteChannel(editingChannel.id)
            setEditingChannel(null)
          }}
        />
      )}
    </div>
  )
}

interface ChannelItemProps {
  channel: Channel
  onEdit: () => void
  onDelete: () => void
}

function ChannelItem({ channel, onEdit, onDelete }: ChannelItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case 'voice':
        return <Volume2 className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      default:
        return <Hash className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      layout
      className="group flex items-center gap-2 p-3 rounded-lg hover:bg-discord-hover transition-colors"
    >
      <GripVertical className="w-4 h-4 text-discord-text-dim opacity-0 group-hover:opacity-100 cursor-grab" />

      <span className="text-discord-text-dim">
        {getChannelIcon(channel.type)}
      </span>

      <span className="flex-1 text-white">{channel.name}</span>

      <span className="px-2 py-0.5 rounded text-xs bg-discord-hover text-discord-text-dim capitalize">
        {channel.type}
      </span>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-discord-deep transition-all"
        >
          <Settings className="w-4 h-4 text-discord-text-dim" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 bg-discord-surface border border-discord-deep rounded-lg shadow-xl py-1 min-w-[140px]">
              <button
                onClick={() => {
                  onEdit()
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-discord-text-muted hover:bg-discord-hover flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete()
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-discord-red hover:bg-discord-hover flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

interface CreateChannelModalProps {
  open: boolean
  onClose: () => void
  value: { name: string; type: ChannelType; category: string }
  onChange: (value: { name: string; type: ChannelType; category: string }) => void
  onSubmit: () => void
}

function CreateChannelModal({ open, onClose, value, onChange, onSubmit }: CreateChannelModalProps) {
  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create Channel</ModalTitle>
        </ModalHeader>
        <div className="space-y-4">
          <Input
            label="Channel Name"
            placeholder="general"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-discord-text-muted">
              Channel Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['text', 'voice', 'video'] as ChannelType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onChange({ ...value, type })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                    value.type === type
                      ? 'border-discord-blurple bg-discord-blurple/10'
                      : 'border-discord-deep hover:border-discord-surface2'
                  )}
                >
                  {type === 'voice' && <Volume2 className="w-6 h-6" />}
                  {type === 'video' && <Video className="w-6 h-6" />}
                  {type === 'text' && <Hash className="w-6 h-6" />}
                  <span className="text-sm capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Category (optional)"
            placeholder="General"
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!value.name.trim()}>
            Create Channel
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}

interface EditChannelModalProps {
  open: boolean
  onClose: () => void
  channel: Channel
  onSave: (updates: Partial<Channel>) => void
  onDelete: () => void
}

function EditChannelModal({ open, onClose, channel, onSave, onDelete }: EditChannelModalProps) {
  const [name, setName] = useState(channel.name)
  const [category, setCategory] = useState(channel.category || '')

  const handleSave = () => {
    onSave({ name, category })
  }

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Edit Channel</ModalTitle>
        </ModalHeader>
        <div className="space-y-4">
          <Input
            label="Channel Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div className="pt-4 border-t border-discord-deep">
            <Button variant="danger" onClick={onDelete} className="w-full">
              <Trash2 className="w-4 h-4" />
              Delete Channel
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Changes
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}
