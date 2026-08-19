import { createClient } from '@/lib/supabase/client'
import {
  rowToUser,
  rowToRole,
  rowToCommunity,
  rowToChannel,
  rowToMessage,
  rowToReaction,
  rowToCommunityMember,
} from '@/lib/supabase/mappers'
import type {
  Community,
  Channel,
  CommunityMember,
  Invite,
  Message,
  Role,
} from '@/types'

const supabase = () => createClient()

// ===== Communities =====

/** Communities the user is a member of. */
export async function fetchUserCommunities(userId: string): Promise<Community[]> {
  const { data, error } = await supabase()
    .from('community_members')
    .select(`
      community:communities (*)
    `)
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? [])
    .map((row: any) => row.community)
    .filter(Boolean)
    .map(rowToCommunity)
}

/** Create a community + default channels + the user's membership in one shot. */
export async function createCommunityWithDefaults(
  ownerId: string,
  name: string,
  description: string | null,
  category: string
): Promise<{ community: Community; channels: Channel[] }> {
  const sb = supabase()

  const { data: comm, error: commErr } = await sb
    .from('communities')
    .insert({
      name,
      description,
      category,
      owner_id: ownerId,
    })
    .select()
    .single()
  if (commErr || !comm) throw commErr ?? new Error('No community returned')
  const community = rowToCommunity(comm)

  // Default roles
  const { error: rolesErr } = await sb.rpc('create_default_roles', {
    p_community_id: community.id,
  })
  if (rolesErr) console.warn('create_default_roles failed:', rolesErr.message)

  // Owner role
  const { data: ownerRole } = await sb
    .from('roles')
    .select('*')
    .eq('community_id', community.id)
    .eq('name', 'Owner')
    .single()

  // Membership
  const { error: memberErr } = await sb.from('community_members').insert({
    community_id: community.id,
    user_id: ownerId,
    role_id: ownerRole?.id ?? null,
  })
  if (memberErr) throw memberErr

  // Default channels
  const { data: channels, error: chErr } = await sb
    .from('channels')
    .insert([
      { community_id: community.id, name: 'general',       type: 'text',  category: 'Information', position: 0 },
      { community_id: community.id, name: 'announcements', type: 'text',  category: 'Information', position: 1 },
      { community_id: community.id, name: 'Voice Lounge',  type: 'voice', category: 'Voice',       position: 2 },
    ])
    .select()
  if (chErr) throw chErr
  return {
    community,
    channels: (channels ?? []).map(rowToChannel),
  }
}

// ===== Channels =====

export async function fetchChannelsForCommunity(
  communityId: string
): Promise<Channel[]> {
  const { data, error } = await supabase()
    .from('channels')
    .select('*')
    .eq('community_id', communityId)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToChannel)
}

export async function fetchAllChannelsForUser(userId: string): Promise<Channel[]> {
  const communities = await fetchUserCommunities(userId)
  if (communities.length === 0) return []
  const { data, error } = await supabase()
    .from('channels')
    .select('*')
    .in('community_id', communities.map((c) => c.id))
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToChannel)
}

// ===== Members =====

export async function fetchMembers(communityId: string): Promise<CommunityMember[]> {
  const { data, error } = await supabase()
    .from('community_members')
    .select(`
      *,
      user:users (*),
      role:roles (*)
    `)
    .eq('community_id', communityId)
  if (error) throw error
  return (data ?? []).map((row: any) =>
    rowToCommunityMember(row, row.user ? rowToUser(row.user) : undefined, row.role ? rowToRole(row.role) : null)
  )
}

// ===== Messages =====

export async function fetchMessages(channelId: string): Promise<Message[]> {
  const sb = supabase()
  const { data, error } = await sb
    .from('messages')
    .select(`
      *,
      author:users (*),
      reactions (*, user_id)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error

  // Group reactions per message
  const byMessage: Record<string, any[]> = {}
  for (const row of data ?? []) {
    if (!byMessage[row.id]) byMessage[row.id] = []
    byMessage[row.id].push(row)
  }

  return (data ?? []).map((row: any) => {
    // Reactions: collapse raw rows into Reaction[]
    const rawReactions = (row.reactions ?? []) as any[]
    const grouped: Record<string, { count: number; userIds: string[] }> = {}
    for (const r of rawReactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, userIds: [] }
      grouped[r.emoji].count++
      grouped[r.emoji].userIds.push(r.user_id)
    }
    const reactions = Object.entries(grouped).map(([emoji, g]) => ({
      emoji,
      count: g.count,
      userIds: g.userIds,
      reacted: false, // overridden per-user in UI if needed
    }))
    return rowToMessage(row, row.author ? rowToUser(row.author) : undefined, reactions)
  })
}

export async function sendMessage(
  channelId: string,
  authorId: string,
  content: string
): Promise<Message> {
  const sb = supabase()
  const { data, error } = await sb
    .from('messages')
    .insert({
      channel_id: channelId,
      author_id: authorId,
      content,
    })
    .select(`
      *,
      author:users (*),
      reactions (*)
    `)
    .single()
  if (error || !data) throw error ?? new Error('No message returned')
  return rowToMessage(data, (data as any).author ? rowToUser((data as any).author) : undefined, [])
}

// ===== Community update/delete =====

export async function fetchCommunityById(
  communityId: string
): Promise<Community | null> {
  const { data, error } = await supabase()
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .maybeSingle()
  if (error) throw error
  return data ? rowToCommunity(data) : null
}

export async function updateCommunity(
  communityId: string,
  updates: Partial<Pick<Community, 'name' | 'description' | 'category' | 'iconUrl' | 'bannerUrl'>>
): Promise<Community> {
  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.iconUrl !== undefined) dbUpdates.icon_url = updates.iconUrl
  if (updates.bannerUrl !== undefined) dbUpdates.banner_url = updates.bannerUrl

  const { data, error } = await supabase()
    .from('communities')
    .update(dbUpdates)
    .eq('id', communityId)
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to update community')
  return rowToCommunity(data)
}

export async function deleteCommunity(communityId: string): Promise<void> {
  const { error } = await supabase()
    .from('communities')
    .delete()
    .eq('id', communityId)
  if (error) throw error
}

// ===== Channel CRUD =====

export async function createChannel(
  communityId: string,
  name: string,
  type: 'text' | 'voice' | 'video',
  category: string | null
): Promise<Channel> {
  // Get next position
  const { data: existing } = await supabase()
    .from('channels')
    .select('position')
    .eq('community_id', communityId)
    .order('position', { ascending: false })
    .limit(1)
  const nextPosition = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0

  const { data, error } = await supabase()
    .from('channels')
    .insert({
      community_id: communityId,
      name,
      type,
      category,
      position: nextPosition,
    })
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to create channel')
  return rowToChannel(data)
}

export async function updateChannel(
  channelId: string,
  updates: Partial<Pick<Channel, 'name' | 'category' | 'position'>>
): Promise<Channel> {
  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.position !== undefined) dbUpdates.position = updates.position

  const { data, error } = await supabase()
    .from('channels')
    .update(dbUpdates)
    .eq('id', channelId)
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to update channel')
  return rowToChannel(data)
}

export async function deleteChannel(channelId: string): Promise<void> {
  const { error } = await supabase()
    .from('channels')
    .delete()
    .eq('id', channelId)
  if (error) throw error
}

// ===== Roles CRUD =====

export async function fetchRoles(communityId: string): Promise<Role[]> {
  const { data, error } = await supabase()
    .from('roles')
    .select('*')
    .eq('community_id', communityId)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToRole)
}

export async function createRole(
  communityId: string,
  name: string,
  color: string,
  permissions: number[]
): Promise<Role> {
  const perms = (permissions ?? []).reduce((acc, p) => acc | p, 0)
  const { data: existing } = await supabase()
    .from('roles')
    .select('position')
    .eq('community_id', communityId)
    .order('position', { ascending: false })
    .limit(1)
  const nextPosition = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0

  const { data, error } = await supabase()
    .from('roles')
    .insert({
      community_id: communityId,
      name,
      color,
      permissions: perms,
      position: nextPosition,
    })
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to create role')
  return rowToRole(data)
}

export async function updateRole(
  roleId: string,
  updates: { name?: string; color?: string; permissions?: number[]; position?: number }
): Promise<Role> {
  const dbUpdates: any = { ...updates }
  if (updates.permissions !== undefined) {
    dbUpdates.permissions = (updates.permissions ?? []).reduce((acc, p) => acc | p, 0)
  }
  const { data, error } = await supabase()
    .from('roles')
    .update(dbUpdates)
    .eq('id', roleId)
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to update role')
  return rowToRole(data)
}

export async function deleteRole(roleId: string): Promise<void> {
  const { error } = await supabase()
    .from('roles')
    .delete()
    .eq('id', roleId)
  if (error) throw error
}

// ===== Member management =====

export async function updateMemberRole(
  memberId: string,
  roleId: string
): Promise<void> {
  const { error } = await supabase()
    .from('community_members')
    .update({ role_id: roleId })
    .eq('id', memberId)
  if (error) throw error
}

export async function kickMember(memberId: string): Promise<void> {
  const { error } = await supabase()
    .from('community_members')
    .delete()
    .eq('id', memberId)
  if (error) throw error
}

export async function timeoutMember(memberId: string, durationMinutes: number): Promise<void> {
  const timeoutUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
  const { error } = await supabase()
    .from('community_members')
    .update({ timeout_until: timeoutUntil } as any)
    .eq('id', memberId)
  if (error) {
    // Fallback: kick if column doesn't exist
    await kickMember(memberId)
  }
}

export async function banMember(memberId: string, reason?: string): Promise<void> {
  // 1. Look up the membership to get community_id and user_id
  const { data: member, error: memberErr } = await supabase()
    .from('community_members')
    .select('community_id, user_id')
    .eq('id', memberId)
    .single()
  if (memberErr || !member) throw memberErr ?? new Error('Member not found')

  // 2. Insert into bans
  const { error: banErr } = await supabase()
    .from('bans')
    .insert({
      community_id: member.community_id,
      user_id: member.user_id,
      reason: reason ?? null,
    })
  if (banErr && banErr.code !== '23505') throw banErr // ignore duplicate

  // 3. Remove from community_members
  const { error: delErr } = await supabase()
    .from('community_members')
    .delete()
    .eq('id', memberId)
  if (delErr) throw delErr
}

export async function unbanMember(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from('bans')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function fetchBans(communityId: string): Promise<Ban[]> {
  const { data, error } = await supabase()
    .from('bans')
    .select('*, user:users(id, username, display_name, avatar_url)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('fetchBans error:', error.message)
    return []
  }
  return (data ?? []).map(rowToBan)
}

export interface Ban {
  id: string
  communityId: string
  userId: string
  reason: string | null
  bannedBy: string | null
  createdAt: Date
  user?: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

function rowToBan(row: any): Ban {
  return {
    id: row.id,
    communityId: row.community_id,
    userId: row.user_id,
    reason: row.reason ?? null,
    bannedBy: row.banned_by ?? null,
    createdAt: new Date(row.created_at),
    user: row.user ? {
      id: row.user.id,
      username: row.user.username,
      displayName: row.user.display_name,
      avatarUrl: row.user.avatar_url,
    } : undefined,
  }
}

// ===== Engagement (messaging stats) =====

export interface EngagementStats {
  messagesToday: number
  messagesThisWeek: number
  activeMembers: number
  pendingInvites: number
}

export async function fetchEngagementStats(communityId: string): Promise<EngagementStats> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get all channel ids for this community
  const { data: channelRows } = await supabase()
    .from('channels')
    .select('id')
    .eq('community_id', communityId)
  const channelIds = (channelRows ?? []).map((c) => c.id)

  let messagesToday = 0
  let messagesThisWeek = 0
  let activeMembers = 0

  if (channelIds.length > 0) {
    const { count: today } = await supabase()
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('channel_id', channelIds)
      .gte('created_at', oneDayAgo)
    messagesToday = today ?? 0

    const { count: week } = await supabase()
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('channel_id', channelIds)
      .gte('created_at', sevenDaysAgo)
    messagesThisWeek = week ?? 0

    const { data: senders } = await supabase()
      .from('messages')
      .select('sender_id')
      .in('channel_id', channelIds)
      .gte('created_at', sevenDaysAgo)
    const uniqueSenders = new Set((senders ?? []).map((m) => m.sender_id))
    activeMembers = uniqueSenders.size
  }

  // Pending invites
  const { count: pendingInvitesCount } = await supabase()
    .from('invites')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', communityId)
  const pendingInvites = pendingInvitesCount ?? 0

  return { messagesToday, messagesThisWeek, activeMembers, pendingInvites }
}

// ===== Webhooks =====

export interface Webhook {
  id: string
  communityId: string
  channelId: string
  name: string
  url: string
  createdBy: string
  createdAt: Date
}

export async function fetchWebhooks(communityId: string): Promise<Webhook[]> {
  const { data, error } = await supabase()
    .from('webhooks')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('fetchWebhooks error:', error.message)
    return []
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    communityId: row.community_id,
    channelId: row.channel_id,
    name: row.name,
    url: row.url,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  }))
}

export async function createWebhook(communityId: string, channelId: string, name: string, createdBy: string): Promise<Webhook> {
  // Generate a webhook token; the url is composed as the public api path
  const token = crypto.randomUUID().replace(/-/g, '')
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${communityId}/${token}`
  const { data, error } = await supabase()
    .from('webhooks')
    .insert({
      community_id: communityId,
      channel_id: channelId,
      name,
      url,
      created_by: createdBy,
    })
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to create webhook')
  return {
    id: data.id,
    communityId: data.community_id,
    channelId: data.channel_id,
    name: data.name,
    url: data.url,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
  }
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const { error } = await supabase().from('webhooks').delete().eq('id', webhookId)
  if (error) throw error
}

// ===== Custom emojis =====

export interface CustomEmoji {
  id: string
  communityId: string
  name: string
  imageUrl: string
  createdBy: string
  createdAt: Date
}

export async function fetchEmojis(communityId: string): Promise<CustomEmoji[]> {
  const { data, error } = await supabase()
    .from('emojis')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('fetchEmojis error:', error.message)
    return []
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    communityId: row.community_id,
    name: row.name,
    imageUrl: row.image_url,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  }))
}

export async function createEmoji(communityId: string, name: string, imageUrl: string, createdBy: string): Promise<CustomEmoji> {
  const { data, error } = await supabase()
    .from('emojis')
    .insert({
      community_id: communityId,
      name,
      image_url: imageUrl,
      created_by: createdBy,
    })
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to create emoji')
  return {
    id: data.id,
    communityId: data.community_id,
    name: data.name,
    imageUrl: data.image_url,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
  }
}

export async function deleteEmoji(emojiId: string): Promise<void> {
  const { error } = await supabase().from('emojis').delete().eq('id', emojiId)
  if (error) throw error
}

// ===== Audit log (computed from existing data; no dedicated table) =====

export interface AuditEvent {
  id: string
  at: Date
  actorId: string
  actorName: string
  action: string
  target?: string
}

export async function fetchAuditLog(communityId: string, limit = 50): Promise<AuditEvent[]> {
  const events: AuditEvent[] = []

  // Bans
  const { data: banRows } = await supabase()
    .from('bans')
    .select('id, created_at, banned_by, user_id, reason')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(limit)
  for (const row of banRows ?? []) {
    const actor = row.banned_by ? await fetchUserSummary(row.banned_by) : null
    const target = row.user_id ? await fetchUserSummary(row.user_id) : null
    events.push({
      id: `ban-${row.id}`,
      at: new Date(row.created_at),
      actorId: row.banned_by ?? '',
      actorName: actor?.displayName ?? actor?.username ?? 'Sistema',
      action: `baniu ${target?.displayName ?? target?.username ?? 'um usuário'}${row.reason ? ` (motivo: ${row.reason})` : ''}`,
    })
  }

  // Channels
  const { data: channelRows } = await supabase()
    .from('channels')
    .select('id, name, created_at, created_by')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(limit)
  for (const row of channelRows ?? []) {
    let actorName = 'Membro'
    if (row.created_by) {
      const u = await fetchUserSummary(row.created_by)
      actorName = u?.displayName ?? u?.username ?? 'Membro'
    }
    events.push({
      id: `chan-${row.id}`,
      at: new Date(row.created_at),
      actorId: row.created_by ?? '',
      actorName,
      action: `criou o canal #${row.name}`,
    })
  }

  // Members joined
  const { data: memberRows } = await supabase()
    .from('community_members')
    .select('id, joined_at, user_id')
    .eq('community_id', communityId)
    .order('joined_at', { ascending: false })
    .limit(limit)
  for (const row of memberRows ?? []) {
    const u = row.user_id ? await fetchUserSummary(row.user_id) : null
    events.push({
      id: `mem-${row.id}`,
      at: new Date(row.joined_at ?? new Date()),
      actorId: row.user_id ?? '',
      actorName: u?.displayName ?? u?.username ?? 'Alguém',
      action: 'entrou na comunidade',
    })
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime())
  return events.slice(0, limit)
}

async function fetchUserSummary(userId: string): Promise<{ id: string; username: string; displayName: string } | null> {
  const { data } = await supabase()
    .from('users')
    .select('id, username, display_name')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
  }
}

// ===== Direct Messages =====

export interface DMThread {
  id: string
  participants: string[]
  lastMessage?: { content: string; senderId: string; createdAt: Date }
  createdAt: Date
}

export interface DMMessage {
  id: string
  threadId: string
  senderId: string
  content: string
  createdAt: Date
}

export async function fetchDMThreads(userId: string): Promise<DMThread[]> {
  const { data: participantRows, error: partErr } = await supabase()
    .from('dm_participants')
    .select('thread_id, threads:dm_threads(id, created_at)')
    .eq('user_id', userId)
  if (partErr || !participantRows) return []

  const threadIds = participantRows.map((p) => p.thread_id)
  if (threadIds.length === 0) return []

  const { data: allParticipants } = await supabase()
    .from('dm_participants')
    .select('thread_id, user_id')
    .in('thread_id', threadIds)

  const { data: lastMessages } = await supabase()
    .from('dm_messages')
    .select('id, thread_id, sender_id, content, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false })

  const lastByThread = new Map<string, { content: string; senderId: string; createdAt: Date }>()
  for (const m of lastMessages ?? []) {
    if (!lastByThread.has(m.thread_id)) {
      lastByThread.set(m.thread_id, {
        content: m.content,
        senderId: m.sender_id,
        createdAt: new Date(m.created_at),
      })
    }
  }

  return participantRows.map((row: any) => {
    const threadId = row.thread_id
    const participants = (allParticipants ?? [])
      .filter((p) => p.thread_id === threadId)
      .map((p) => p.user_id)
    return {
      id: threadId,
      participants,
      lastMessage: lastByThread.get(threadId),
      createdAt: new Date(row.threads?.created_at ?? new Date()),
    }
  })
}

export async function fetchDMMessages(threadId: string): Promise<DMMessage[]> {
  const { data, error } = await supabase()
    .from('dm_messages')
    .select('id, thread_id, author_id, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    threadId: row.thread_id,
    senderId: row.author_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  }))
}

export async function sendDM(threadId: string, senderId: string, content: string): Promise<DMMessage> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Mensagem vazia')
  console.log('[DM] sendDM chamado', { threadId, senderId, contentLen: trimmed.length })
  const { data, error } = await supabase()
    .from('dm_messages')
    .insert({ thread_id: threadId, author_id: senderId, content: trimmed })
    .select('id, thread_id, author_id, content, created_at')
    .single()
  if (error || !data) {
    console.error('[DM] sendDM falhou', { error, code: error?.code, message: error?.message })
    throw error ?? new Error('Falha ao enviar DM')
  }
  return {
    id: data.id,
    threadId: data.thread_id,
    senderId: data.author_id,
    content: data.content,
    createdAt: new Date(data.created_at),
  }
}

export async function createOrFindDMThread(userId: string, otherId: string): Promise<DMThread> {
  if (userId === otherId) throw new Error('Não pode abrir DM com você mesmo')

  // Debug: verifica se há sessão ativa no client
  const sb = supabase()
  const { data: sessionData } = await sb.auth.getSession()
  console.log('[DM] createOrFindDMThread', {
    userId,
    otherId,
    hasSession: !!sessionData.session,
    authUid: sessionData.session?.user?.id,
    userIdMatches: sessionData.session?.user?.id === userId,
  })

  if (!sessionData.session) {
    throw new Error('Sessão expirada — faça login novamente')
  }

  // 1. Look for an existing 2-person thread shared by both
  const { data: myThreads } = await supabase()
    .from('dm_participants')
    .select('thread_id')
    .eq('user_id', userId)
  const myThreadIds = (myThreads ?? []).map((r) => r.thread_id)

  if (myThreadIds.length > 0) {
    const { data: sharedRows } = await supabase()
      .from('dm_participants')
      .select('thread_id, user_id')
      .in('thread_id', myThreadIds)
    const otherThreadIds = (sharedRows ?? [])
      .filter((r) => r.user_id === otherId)
      .map((r) => r.thread_id)
    if (otherThreadIds.length > 0) {
      const threadId = otherThreadIds[0]
      return { id: threadId, participants: [userId, otherId], createdAt: new Date() }
    }
  }

  // 2. Otherwise create a fresh thread + insert both participants
  const { data: thread, error: threadErr } = await supabase()
    .from('dm_threads')
    .insert({})
    .select()
    .single()
  if (threadErr || !thread) throw threadErr ?? new Error('Falha ao criar thread')

  const { error: partErr } = await supabase()
    .from('dm_participants')
    .insert([
      { thread_id: thread.id, user_id: userId },
      { thread_id: thread.id, user_id: otherId },
    ])
  if (partErr) throw partErr

  return { id: thread.id, participants: [userId, otherId], createdAt: new Date(thread.created_at) }
}

export async function fetchFriends(userId: string): Promise<Array<{ id: string; username: string; displayName: string; avatarUrl: string | null; status: string }>> {
  const { data, error } = await supabase()
    .from('friendships')
    .select('user_id, friend_id, status')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')
  if (error || !data) return []
  const otherIds = data
    .map((r) => (r.user_id === userId ? r.friend_id : r.user_id))
    .filter((id) => id && id !== userId)
  if (otherIds.length === 0) return []
  const { data: users } = await supabase()
    .from('users')
    .select('id, username, display_name, avatar_url, status')
    .in('id', otherIds)
  return (users ?? []).map((u: any) => ({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    status: u.status,
  }))
}

// ===== Friend requests =====

/**
 * Fetch pending friend requests the user RECEIVED (where user is the friend_id).
 * Returns the requester + the friendship row id.
 */
export async function fetchIncomingFriendRequests(
  userId: string
): Promise<Array<{ friendshipId: string; user: { id: string; username: string; displayName: string; avatarUrl: string | null; status: string } }>> {
  const sb = supabase()
  const { data, error } = await sb
    .from('friendships')
    .select('id, user_id, friend_id, status')
    .eq('friend_id', userId)
    .eq('status', 'pending')
  if (error || !data) return []
  const ids = data.map((r) => r.user_id)
  if (ids.length === 0) return []
  const { data: users } = await sb
    .from('users')
    .select('id, username, display_name, avatar_url, status')
    .in('id', ids)
  const userMap: Record<string, any> = {}
  for (const u of users ?? []) userMap[u.id] = u
  return data
    .map((r) => {
      const u = userMap[r.user_id]
      if (!u) return null
      return {
        friendshipId: r.id,
        user: {
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          avatarUrl: u.avatar_url,
          status: u.status,
        },
      }
    })
    .filter(Boolean) as any
}

/** Pending requests the user SENT. */
export async function fetchOutgoingFriendRequests(
  userId: string
): Promise<Array<{ friendshipId: string; user: { id: string; username: string; displayName: string; avatarUrl: string | null; status: string } }>> {
  const sb = supabase()
  const { data, error } = await sb
    .from('friendships')
    .select('id, user_id, friend_id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
  if (error || !data) return []
  const ids = data.map((r) => r.friend_id)
  if (ids.length === 0) return []
  const { data: users } = await sb
    .from('users')
    .select('id, username, display_name, avatar_url, status')
    .in('id', ids)
  const userMap: Record<string, any> = {}
  for (const u of users ?? []) userMap[u.id] = u
  return data
    .map((r) => {
      const u = userMap[r.friend_id]
      if (!u) return null
      return {
        friendshipId: r.id,
        user: {
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          avatarUrl: u.avatar_url,
          status: u.status,
        },
      }
    })
    .filter(Boolean) as any
}

/** Send a friend request. Inserts row with status=pending. Dedup via uniqueness. */
export async function sendFriendRequest(fromUserId: string, toUsername: string): Promise<void> {
  const sb = supabase()
  const { data: target, error: uerr } = await sb
    .from('users')
    .select('id')
    .eq('username', toUsername)
    .maybeSingle()
  if (uerr) throw uerr
  if (!target) throw new Error('Usuário não encontrado')
  if (target.id === fromUserId) throw new Error('Você não pode adicionar a si mesmo')
  // Check if any row already exists either direction
  const { data: existing } = await sb
    .from('friendships')
    .select('id, status, user_id, friend_id')
    .or(
      `and(user_id.eq.${fromUserId},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${fromUserId})`
    )
    .maybeSingle()
  if (existing) {
    if (existing.status === 'accepted') throw new Error('Vocês já são amigos')
    if (existing.status === 'pending') throw new Error('Já existe um pedido pendente')
  }
  const { error } = await sb.from('friendships').insert({
    user_id: fromUserId,
    friend_id: target.id,
    status: 'pending',
  })
  if (error) throw error
}

/** Accept an incoming friend request. Sets status=accepted. */
export async function acceptFriendRequest(currentUserId: string, requesterId: string): Promise<void> {
  const sb = supabase()
  const { error } = await sb
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', requesterId)
    .eq('friend_id', currentUserId)
    .eq('status', 'pending')
  if (error) throw error
}

/** Decline or cancel a friendship row either direction. */
export async function declineFriendRequest(currentUserId: string, otherUserId: string): Promise<void> {
  const sb = supabase()
  const { error } = await sb
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${otherUserId},friend_id.eq.${currentUserId}),and(user_id.eq.${currentUserId},friend_id.eq.${otherUserId})`
    )
  if (error) throw error
}

/** Remove an existing accepted friendship. */
export async function removeFriend(currentUserId: string, otherUserId: string): Promise<void> {
  const sb = supabase()
  const { error } = await sb
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${otherUserId},friend_id.eq.${currentUserId}),and(user_id.eq.${currentUserId},friend_id.eq.${otherUserId})`
    )
  if (error) throw error
}

// ===== Invites =====

export type InviteStatus = 'valid' | 'expired' | 'maxed' | 'invalid'

export interface InvitePreviewResult {
  status: InviteStatus
  invite: Invite | null
  community: Community | null
  error?: string
}

function rowToInvite(row: any): Invite {
  return {
    id: row.id,
    communityId: row.community_id,
    code: row.code,
    createdBy: row.created_by,
    max_uses: row.max_uses,
    uses: row.uses ?? 0,
    expires_at: row.expires_at ?? null,
    created_at: row.created_at,
  }
}

/** Fetch invite + community, validate status. */
export async function fetchInviteByCode(
  code: string
): Promise<InvitePreviewResult> {
  const sb = supabase()
  const { data, error } = await sb
    .from('invites')
    .select(`
      *,
      community:communities (*)
    `)
    .eq('code', code)
    .maybeSingle()

  if (error || !data) {
    return { status: 'invalid', invite: null, community: null }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return {
      status: 'expired',
      invite: rowToInvite(data),
      community: data.community ? rowToCommunity(data.community) : null,
    }
  }
  if (data.max_uses && (data.uses ?? 0) >= data.max_uses) {
    return {
      status: 'maxed',
      invite: rowToInvite(data),
      community: data.community ? rowToCommunity(data.community) : null,
    }
  }

  return {
    status: 'valid',
    invite: rowToInvite(data),
    community: data.community ? rowToCommunity(data.community) : null,
  }
}

export async function createInvite(
  communityId: string,
  createdBy: string,
  options: { maxUses?: number | null; expiresInHours?: number | null } = {}
): Promise<Invite> {
  const sb = supabase()
  // Random base32-ish code
  const code = await generateUniqueCode(sb)

  const insert: any = {
    community_id: communityId,
    code,
    created_by: createdBy,
    max_uses: options.maxUses ?? null,
  }
  if (options.expiresInHours && options.expiresInHours > 0) {
    insert.expires_at = new Date(
      Date.now() + options.expiresInHours * 60 * 60 * 1000
    ).toISOString()
  }

  const { data, error } = await sb
    .from('invites')
    .insert(insert)
    .select()
    .single()
  if (error || !data) throw error ?? new Error('Failed to create invite')
  return rowToInvite(data)
}

export async function listInvites(communityId: string): Promise<Invite[]> {
  const sb = supabase()
  const { data, error } = await sb
    .from('invites')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToInvite)
}

export async function deleteInvite(inviteId: string): Promise<void> {
  const sb = supabase()
  const { error } = await sb.from('invites').delete().eq('id', inviteId)
  if (error) throw error
}

/** Consume an invite: join the community + bump the use counter. */
export async function acceptInvite(
  code: string,
  userId: string
): Promise<{ communityId: string }> {
  const sb = supabase()

  // Get invite (re-check validity inside a single transaction via RPC later
  // if needed; here we do the simple read + insert + bump).
  const { data: invite, error: invErr } = await sb
    .from('invites')
    .select('*')
    .eq('code', code)
    .single()
  if (invErr || !invite) throw new Error('Invite not found')
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error('Invite expired')
  }
  if (invite.max_uses && (invite.uses ?? 0) >= invite.max_uses) {
    throw new Error('Invite maxed out')
  }

  // Already a member? Skip insertion but still consider "accepted".
  const { data: existing } = await sb
    .from('community_members')
    .select('id')
    .eq('community_id', invite.community_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    // Find the default Member role
    const { data: memberRole } = await sb
      .from('roles')
      .select('id')
      .eq('community_id', invite.community_id)
      .eq('name', 'Member')
      .maybeSingle()

    const { error: memErr } = await sb.from('community_members').insert({
      community_id: invite.community_id,
      user_id: userId,
      role_id: memberRole?.id ?? null,
    })
    if (memErr) throw memErr
  }

  // Bump uses (always, so even existing members can't bypass)
  const { error: bumpErr } = await sb
    .rpc('increment_invite_uses', { p_invite_id: invite.id })
  if (bumpErr) {
    // Fallback: direct update if RPC isn't installed
    await sb
      .from('invites')
      .update({ uses: (invite.uses ?? 0) + 1 })
      .eq('id', invite.id)
  }

  return { communityId: invite.community_id }
}

export interface SearchMessageResult {
  id: string
  channel_id: string
  author_id: string
  content: string
  authorName?: string
  created_at: string
}

/**
 * Busca mensagens por texto dentro de um canal.
 * Usa ilike (case-insensitive). Retorna até `limit` resultados.
 */
export async function searchMessages(
  query: string,
  channelId: string,
  limit = 20
): Promise<SearchMessageResult[]> {
  const sb = supabase()
  const { data, error } = await sb
    .from('messages')
    .select('id, channel_id, author_id, content, created_at, profiles!messages_author_id_fkey(full_name)')
    .eq('channel_id', channelId)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((row: any) => ({
    id: row.id,
    channel_id: row.channel_id,
    author_id: row.author_id,
    content: row.content,
    authorName: row.profiles?.full_name ?? undefined,
    created_at: row.created_at,
  }))
}

async function generateUniqueCode(sb: ReturnType<typeof createClient>): Promise<string> {
  // 10-char base32-ish. Try a few times if collision.
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = ''
    const bytes = new Uint8Array(10)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes)
    } else {
      for (let i = 0; i < 10; i++) bytes[i] = Math.floor(Math.random() * 256)
    }
    for (let i = 0; i < 10; i++) code += alphabet[bytes[i] % alphabet.length]
    const { data: exists } = await sb
      .from('invites')
      .select('id')
      .eq('code', code)
      .maybeSingle()
    if (!exists) return code
  }
  // Last resort: timestamp-based
  return `inv-${Date.now().toString(36)}`
}
