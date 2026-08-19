// Permission constants for database
export const PERMISSION_BITS = {
  ADMINISTER: 1 << 0,          // 1
  MANAGE_CHANNELS: 1 << 1,     // 2
  DELETE_CHANNELS: 1 << 2,     // 4
  MANAGE_MESSAGES: 1 << 3,      // 8
  KICK_MEMBERS: 1 << 4,        // 16
  BAN_MEMBERS: 1 << 5,         // 32
  CREATE_INVITES: 1 << 6,      // 64
  MANAGE_ROLES: 1 << 7,        // 128
  VIEW_CHANNELS: 1 << 8,       // 256
  SEND_MESSAGES: 1 << 9,       // 512
  SPEAK: 1 << 10,              // 1024
  STREAM: 1 << 11,             // 2048
  USE_VIDEO: 1 << 12,          // 4096
}

export const PERMISSION_LABELS: Record<number, string> = {
  [PERMISSION_BITS.ADMINISTER]: 'Administrate Community',
  [PERMISSION_BITS.MANAGE_CHANNELS]: 'Manage Channels',
  [PERMISSION_BITS.DELETE_CHANNELS]: 'Delete Channels',
  [PERMISSION_BITS.MANAGE_MESSAGES]: 'Manage Messages',
  [PERMISSION_BITS.KICK_MEMBERS]: 'Kick Members',
  [PERMISSION_BITS.BAN_MEMBERS]: 'Ban Members',
  [PERMISSION_BITS.CREATE_INVITES]: 'Create Invites',
  [PERMISSION_BITS.MANAGE_ROLES]: 'Manage Roles',
  [PERMISSION_BITS.VIEW_CHANNELS]: 'View Channels',
  [PERMISSION_BITS.SEND_MESSAGES]: 'Send Messages',
  [PERMISSION_BITS.SPEAK]: 'Speak in Voice',
  [PERMISSION_BITS.STREAM]: 'Stream/Share Screen',
  [PERMISSION_BITS.USE_VIDEO]: 'Use Video',
}

export const DEFAULT_ROLES = [
  {
    name: 'Owner',
    color: '#EF4444',
    permissions: Object.values(PERMISSION_BITS),
    position: 0,
    is_owner: true,
  },
  {
    name: 'Admin',
    color: '#F97316',
    permissions: [
      PERMISSION_BITS.MANAGE_CHANNELS,
      PERMISSION_BITS.DELETE_CHANNELS,
      PERMISSION_BITS.MANAGE_MESSAGES,
      PERMISSION_BITS.KICK_MEMBERS,
      PERMISSION_BITS.BAN_MEMBERS,
      PERMISSION_BITS.CREATE_INVITES,
      PERMISSION_BITS.VIEW_CHANNELS,
      PERMISSION_BITS.SEND_MESSAGES,
      PERMISSION_BITS.SPEAK,
      PERMISSION_BITS.STREAM,
      PERMISSION_BITS.USE_VIDEO,
    ],
    position: 1,
    is_owner: false,
  },
  {
    name: 'Moderator',
    color: '#10B981',
    permissions: [
      PERMISSION_BITS.MANAGE_MESSAGES,
      PERMISSION_BITS.KICK_MEMBERS,
      PERMISSION_BITS.CREATE_INVITES,
      PERMISSION_BITS.VIEW_CHANNELS,
      PERMISSION_BITS.SEND_MESSAGES,
      PERMISSION_BITS.SPEAK,
      PERMISSION_BITS.STREAM,
      PERMISSION_BITS.USE_VIDEO,
    ],
    position: 2,
    is_owner: false,
  },
  {
    name: 'Member',
    color: '#6B7280',
    permissions: [
      PERMISSION_BITS.VIEW_CHANNELS,
      PERMISSION_BITS.SEND_MESSAGES,
      PERMISSION_BITS.SPEAK,
      PERMISSION_BITS.USE_VIDEO,
    ],
    position: 3,
    is_owner: false,
  },
]

// Helper to format permissions from bitmask
export function formatPermissions(permissionsBitmask: number): string[] {
  const activePermissions: string[] = []
  for (const [key, value] of Object.entries(PERMISSION_BITS)) {
    if (permissionsBitmask & value) {
      activePermissions.push(PERMISSION_LABELS[value] || key)
    }
  }
  return activePermissions
}
