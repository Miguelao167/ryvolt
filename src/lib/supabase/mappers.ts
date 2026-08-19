import type {
  User,
  Community,
  Channel,
  CommunityMember,
  Message,
  Reaction,
  Role,
} from '@/types'

// Snake_case (DB) → camelCase (app)

export function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bannerUrl: row.banner_url,
    bio: row.bio,
    status: row.status ?? 'offline',
    customStatus: row.custom_status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function rowToRole(row: any): Role {
  const perms = Number(row.permissions ?? 0)
  // Extract individual permission flags as array (for UI)
  const permFlags = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
  const permArray = permFlags.filter((f) => (perms & f) !== 0)
  return {
    id: row.id,
    communityId: row.community_id,
    name: row.name,
    color: row.color,
    permissions: permArray,
    position: row.position ?? 0,
    createdAt: new Date(row.created_at),
  }
}

export function rowToCommunity(row: any): Community {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    iconUrl: row.icon_url,
    bannerUrl: row.banner_url,
    category: row.category ?? 'community',
    createdAt: new Date(row.created_at),
    createdBy: row.owner_id,
    memberCount: row.member_count ?? 1,
    onlineCount: 0, // computed separately if needed
  }
}

export function rowToChannel(row: any): Channel {
  return {
    id: row.id,
    communityId: row.community_id,
    name: row.name,
    type: row.type ?? 'text',
    category: row.category ?? 'General',
    position: row.position ?? 0,
    createdAt: new Date(row.created_at),
  }
}

export function rowToReaction(row: any): Reaction {
  return {
    emoji: row.emoji,
    count: 1,
    userIds: [row.user_id],
    reacted: true,
  }
}

export function rowToMessage(
  row: any,
  author?: User,
  reactions: Reaction[] = []
): Message {
  return {
    id: row.id,
    channelId: row.channel_id,
    authorId: row.author_id,
    author,
    content: row.content,
    attachments: [],
    replyToId: row.reply_to_id,
    reactions,
    pinned: row.pinned ?? false,
    editedAt: row.edited_at ? new Date(row.edited_at) : null,
    createdAt: new Date(row.created_at),
  }
}

export function rowToCommunityMember(
  row: any,
  user?: User,
  role?: Role | null
): CommunityMember {
  return {
    id: row.id,
    communityId: row.community_id,
    userId: row.user_id,
    user,
    roleId: row.role_id ?? '',
    role: role ?? undefined,
    nickname: row.nickname,
    joinedAt: new Date(row.joined_at),
  }
}
