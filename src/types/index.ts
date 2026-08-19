// User types
export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  status: UserStatus
  customStatus: string | null
  createdAt: Date
  updatedAt: Date
  /** Server role shown next to username */
  role?: { name: string; color: string } | null
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline'

// Community types
export interface Community {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  bannerUrl: string | null
  category: CommunityCategory
  createdAt: Date
  createdBy: string
  memberCount: number
  onlineCount: number
}

export type CommunityCategory =
  | 'gaming'
  | 'technology'
  | 'friends'
  | 'study'
  | 'company'
  | 'creators'
  | 'community'
  | 'other'

// Channel types
export interface Channel {
  id: string
  communityId: string
  name: string
  type: ChannelType
  category: string | null
  position: number
  createdAt: Date
}

export type ChannelType = 'text' | 'voice' | 'video' | 'announcement' | 'forum'

// Message types
export interface Message {
  id: string
  channelId: string
  authorId: string
  author?: User
  content: string
  attachments: Attachment[]
  replyToId: string | null
  replyTo?: Message
  reactions: Reaction[]
  pinned: boolean
  editedAt: Date | null
  createdAt: Date
}

export interface Attachment {
  id: string
  type: 'image' | 'video' | 'file' | 'gif'
  url: string
  name: string
  size: number
  mimeType: string
  width?: number
  height?: number
}

export interface Reaction {
  emoji: string
  count: number
  userIds: string[]
  reacted: boolean
}

// Role & Permission types
export interface Role {
  id: string
  communityId: string
  name: string
  color: string
  permissions: number[]
  position: number
  createdAt: Date
  /** Whether this is the server owner (display-only) */
  is_owner?: boolean
  /** Member count from SQL join */
  member_count?: number
}

export const PERMISSIONS = {
  ADMINISTER: 1 << 0,
  MANAGE_CHANNELS: 1 << 1,
  DELETE_CHANNELS: 1 << 2,
  MANAGE_MESSAGES: 1 << 3,
  KICK_MEMBERS: 1 << 4,
  BAN_MEMBERS: 1 << 5,
  CREATE_INVITES: 1 << 6,
  MANAGE_ROLES: 1 << 7,
  VIEW_CHANNELS: 1 << 8,
  SEND_MESSAGES: 1 << 9,
  SPEAK: 1 << 10,
  STREAM: 1 << 11,
  USE_VIDEO: 1 << 12,
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Community Member types
export interface CommunityMember {
  id: string
  communityId: string
  userId: string
  user?: User
  roleId: string
  role?: Role
  nickname: string | null
  joinedAt: Date
}

// Invite types
export interface Invite {
  id: string
  communityId: string
  code: string
  createdBy: string
  max_uses: number | null
  uses: number
  expires_at: string | null
  created_at: string
}

// Friend types
export interface Friend {
  id: string
  userId: string
  friendId: string
  user?: User
  friend?: User
  status: FriendStatus
  createdAt: Date
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked'

// DM Thread types
export interface DMThread {
  id: string
  participants: User[]
  lastMessage?: Message
  updatedAt: Date
}

// Voice channel types
export interface VoiceState {
  channelId: string
  userId: string
  user?: User
  isMuted: boolean
  isDeafened: boolean
  isStreaming: boolean
  isVideoOn: boolean
  speaking: boolean
  joinedAt: Date
}

// Notification types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  createdAt: Date
}

export type NotificationType =
  | 'message'
  | 'mention'
  | 'friend_request'
  | 'invite'
  | 'call'
  | 'community_update'

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// WebSocket event types
export interface WSEvent<T = unknown> {
  type: string
  payload: T
  timestamp: number
}
