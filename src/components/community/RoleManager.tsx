'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Settings,
  Trash2,
  GripVertical,
  Crown,
  Shield,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/ui'
import { PERMISSION_LABELS, PERMISSION_BITS } from '@/lib/permissions'
import type { Role } from '@/types'

interface RoleManagerProps {
  roles: Role[]
  onCreateRole: (role: Partial<Role>) => void
  onUpdateRole: (roleId: string, updates: Partial<Role>) => void
  onDeleteRole: (roleId: string) => void
}

const ROLE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
]

export function RoleManager({
  roles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: RoleManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState({
    name: '',
    color: ROLE_COLORS[0],
    permissions: [] as number[],
  })

  const handleCreate = () => {
    if (!newRole.name.trim()) return
    onCreateRole(newRole)
    setNewRole({ name: '', color: ROLE_COLORS[0], permissions: [] })
    setShowCreateModal(false)
  }

  const togglePermission = (permission: number, current: number[]) => {
    if (current.includes(permission)) {
      return current.filter((p) => p !== permission)
    }
    return [...current, permission]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Roles</h3>
          <p className="text-sm text-discord-text-dim">
            Manage roles and their permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      {/* Role list */}
      <div className="space-y-2">
        {roles.map((role) => (
          <RoleItem
            key={role.id}
            role={role}
            onEdit={() => setEditingRole(role)}
            onDelete={() => onDeleteRole(role.id)}
          />
        ))}
      </div>

      {/* Create Role Modal */}
      <RoleModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Role"
        value={newRole}
        onChange={setNewRole}
        onSubmit={handleCreate}
        colors={ROLE_COLORS}
      />

      {/* Edit Role Modal */}
      {editingRole && (
        <RoleModal
          open={!!editingRole}
          onClose={() => setEditingRole(null)}
          title="Edit Role"
          value={editingRole}
          onChange={(updates) => setEditingRole({ ...editingRole, ...updates } as Role)}
          onSubmit={() => {
            onUpdateRole(editingRole.id, editingRole)
            setEditingRole(null)
          }}
          colors={ROLE_COLORS}
          canDelete={!editingRole.is_owner}
          onDelete={() => {
            onDeleteRole(editingRole.id)
            setEditingRole(null)
          }}
        />
      )}
    </div>
  )
}

interface RoleItemProps {
  role: Role
  onEdit: () => void
  onDelete: () => void
}

function RoleItem({ role, onEdit, onDelete }: RoleItemProps) {
  const isOwner = role.is_owner || role.name === 'Owner'

  return (
    <motion.div
      layout
      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-discord-hover transition-colors"
    >
      <GripVertical className="w-4 h-4 text-discord-text-dim opacity-0 group-hover:opacity-100 cursor-grab" />

      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: role.color }}
      />

      <span className="flex-1 font-medium text-white">
        {role.name}
      </span>

      {isOwner && (
        <span className="px-2 py-0.5 rounded text-xs bg-discord-yellow/20 text-discord-yellow flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Owner
        </span>
      )}

      <span className="text-sm text-discord-text-dim">
        {role.member_count || 0} members
      </span>

      {!isOwner && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-discord-deep transition-colors"
          >
            <Settings className="w-4 h-4 text-discord-text-dim" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-discord-deep transition-colors"
          >
            <Trash2 className="w-4 h-4 text-discord-red" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

interface RoleModalProps {
  open: boolean
  onClose: () => void
  title: string
  value: { name: string; color: string; permissions: number[] }
  onChange: (value: { name: string; color: string; permissions: number[] }) => void
  onSubmit: () => void
  colors: string[]
  canDelete?: boolean
  onDelete?: () => void
}

function RoleModal({
  open,
  onClose,
  title,
  value,
  onChange,
  onSubmit,
  colors,
  canDelete,
  onDelete,
}: RoleModalProps) {
  const allPermissions = Object.entries(PERMISSION_LABELS)

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <div className="space-y-6">
          {/* Name and Color */}
          <div className="flex gap-4">
            <Input
              label="Role Name"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              className="flex-1"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-discord-text-muted">
                Color
              </label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChange({ ...value, color })}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform',
                      value.color === color && 'ring-2 ring-offset-2 ring-offset-discord-surface ring-discord-blurple scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-discord-text-muted">
              Permissions
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
              {allPermissions.map(([bit, label]) => {
                const permissionBit = parseInt(bit)
                const hasPermission = value.permissions.includes(permissionBit)

                return (
                  <label
                    key={bit}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      hasPermission
                        ? 'border-discord-blurple bg-discord-blurple/10'
                        : 'border-discord-deep hover:border-discord-surface2'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={hasPermission}
                      onChange={() =>
                        onChange({
                          ...value,
                          permissions: togglePermissionBit(value.permissions, permissionBit),
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center',
                        hasPermission
                          ? 'bg-discord-blurple border-discord-blurple'
                          : 'border-discord-deep'
                      )}
                    >
                      {hasPermission && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-discord-text-muted">{label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {canDelete && onDelete && (
            <div className="pt-4 border-t border-discord-deep">
              <Button variant="danger" onClick={onDelete} className="w-full">
                <Trash2 className="w-4 h-4" />
                Delete Role
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!value.name.trim()}>
            {title.includes('Create') ? 'Create Role' : 'Save Changes'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}

function togglePermissionBit(current: number[], bit: number): number[] {
  if (current.includes(bit)) {
    return current.filter((p) => p !== bit)
  }
  return [...current, bit]
}
