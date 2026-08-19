export const CATEGORIES = {
  gaming: { name: 'Gaming', icon: '🎮', color: '#8B5CF6' },
  technology: { name: 'Technology', icon: '💻', color: '#3B82F6' },
  friends: { name: 'Friends', icon: '👥', color: '#EC4899' },
  study: { name: 'Study', icon: '📚', color: '#10B981' },
  company: { name: 'Company', icon: '🏢', color: '#F59E0B' },
  creators: { name: 'Creators', icon: '🎨', color: '#EF4444' },
  community: { name: 'Community', icon: '🌐', color: '#6366F1' },
  other: { name: 'Other', icon: '✨', color: '#6B7280' },
} as const

export const USER_STATUS = {
  online: { name: 'Online', color: '#10B981', icon: '🟢' },
  idle: { name: 'Idle', color: '#F59E0B', icon: '🌙' },
  dnd: { name: 'Do Not Disturb', color: '#EF4444', icon: '⛔' },
  offline: { name: 'Offline', color: '#6B7280', icon: '⚫' },
} as const

export const CHANNEL_ICONS = {
  text: '#',
  voice: '🔊',
  video: '📹',
} as const

export const DEFAULT_COMMUNITY_AVATAR = '/default-community.png'
export const DEFAULT_USER_AVATAR = '/default-avatar.png'

export const MAX_FILE_SIZES = {
  avatar: 5 * 1024 * 1024, // 5MB
  banner: 10 * 1024 * 1024, // 10MB
  image: 25 * 1024 * 1024, // 25MB
  video: 100 * 1024 * 1024, // 100MB
  file: 50 * 1024 * 1024, // 50MB
} as const

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm']
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application zip',
  'application/x-rar-compressed',
  'text/plain',
  'application/json',
]

export const SCREEN_SHARE_QUALITY = {
  low: { width: 1280, height: 720, fps: 15, bitrate: 1500000 },
  medium: { width: 1280, height: 720, fps: 30, bitrate: 2500000 },
  high: { width: 1920, height: 1080, fps: 30, bitrate: 4500000 },
  ultra: { width: 1920, height: 1080, fps: 60, bitrate: 6000000 },
} as const

export const DEFAULT_ROLE_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Yellow
  '#10B981', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
] as const

export const EMOJI_CATEGORIES = [
  '😀', '😎', '❤️', '🎮', '🎨', '📚', '🚀', '💡', '🔥', '✨',
  '👍', '👏', '🎉', '🎵', '🌟', '💯', '😢', '😡', '🤔', '😂',
] as const
