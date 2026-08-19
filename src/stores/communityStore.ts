import { create } from 'zustand'
import type { Community, Channel, CommunityMember, Role } from '@/types'
import {
  fetchUserCommunities,
  fetchAllChannelsForUser,
  fetchChannelsForCommunity,
  fetchMembers,
  fetchRoles,
  fetchCommunityById,
  createCommunityWithDefaults,
  updateCommunity,
  deleteCommunity,
  createChannel,
  updateChannel,
  deleteChannel,
  createRole,
  updateRole,
  deleteRole,
  updateMemberRole,
  kickMember,
} from '@/lib/supabase/queries'

interface CommunityState {
  communities: Community[]
  currentCommunity: Community | null
  currentChannel: Channel | null
  members: CommunityMember[]
  channels: Channel[]
  roles: Role[]
  isLoading: boolean

  // Actions
  setCommunities: (communities: Community[]) => void
  setCurrentCommunity: (community: Community | null) => void
  setCurrentChannel: (channel: Channel | null) => void
  setMembers: (members: CommunityMember[]) => void
  setChannels: (channels: Channel[]) => void
  setRoles: (roles: Role[]) => void
  addCommunity: (community: Community) => void
  removeCommunity: (communityId: string) => void
  updateChannel: (channelId: string, updates: Partial<Channel>) => void
  updateCommunityInState: (communityId: string, updates: Partial<Community>) => void
  addChannel: (channel: Channel) => void
  removeChannel: (channelId: string) => void
  addRole: (role: Role) => void
  updateRoleInState: (roleId: string, updates: Partial<Role>) => void
  removeRole: (roleId: string) => void
  updateMemberInState: (memberId: string, updates: Partial<CommunityMember>) => void
  removeMemberFromState: (memberId: string) => void
  setLoading: (loading: boolean) => void

  // Async actions
  loadForUser: (userId: string) => Promise<void>
  loadMembers: (communityId: string) => Promise<void>
  loadRoles: (communityId: string) => Promise<void>
  loadCommunity: (communityId: string) => Promise<Community | null>
  createCommunity: (
    userId: string,
    name: string,
    description: string | null,
    category: string
  ) => Promise<Community>
  saveCommunity: (communityId: string, updates: Partial<Community>) => Promise<void>
  removeCommunityAction: (communityId: string) => Promise<void>
  createChannelAction: (communityId: string, name: string, type: 'text' | 'voice' | 'video', category: string | null) => Promise<Channel>
  saveChannel: (channelId: string, updates: Partial<Channel>) => Promise<void>
  removeChannelAction: (channelId: string) => Promise<void>
  createRoleAction: (communityId: string, name: string, color: string, permissions: number[]) => Promise<Role>
  saveRole: (roleId: string, updates: { name?: string; color?: string; permissions?: number[]; position?: number }) => Promise<void>
  removeRoleAction: (roleId: string) => Promise<void>
  changeMemberRole: (memberId: string, roleId: string) => Promise<void>
  kickMemberAction: (memberId: string) => Promise<void>
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  currentCommunity: null,
  currentChannel: null,
  members: [],
  channels: [],
  roles: [],
  isLoading: false,

  setCommunities: (communities) => set({ communities }),
  setCurrentCommunity: (currentCommunity) => set({ currentCommunity }),
  setCurrentChannel: (currentChannel) => set({ currentChannel }),
  setMembers: (members) => set({ members }),
  setChannels: (channels) => set({ channels }),
  setRoles: (roles) => set({ roles }),

  addCommunity: (community) =>
    set((state) => ({ communities: [...state.communities, community] })),

  removeCommunity: (communityId) =>
    set((state) => ({
      communities: state.communities.filter((c) => c.id !== communityId),
    })),

  updateChannel: (channelId, updates) =>
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.id === channelId ? { ...ch, ...updates } : ch
      ),
    })),

  updateCommunityInState: (communityId, updates) =>
    set((state) => ({
      communities: state.communities.map((c) =>
        c.id === communityId ? { ...c, ...updates } : c
      ),
      currentCommunity:
        state.currentCommunity?.id === communityId
          ? { ...state.currentCommunity, ...updates }
          : state.currentCommunity,
    })),

  addChannel: (channel) =>
    set((state) => ({ channels: [...state.channels, channel] })),

  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((ch) => ch.id !== channelId),
    })),

  addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),

  updateRoleInState: (roleId, updates) =>
    set((state) => ({
      roles: state.roles.map((r) => (r.id === roleId ? { ...r, ...updates } : r)),
    })),

  removeRole: (roleId) =>
    set((state) => ({ roles: state.roles.filter((r) => r.id !== roleId) })),

  updateMemberInState: (memberId, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, ...updates } : m
      ),
    })),

  removeMemberFromState: (memberId) =>
    set((state) => ({ members: state.members.filter((m) => m.id !== memberId) })),

  setLoading: (isLoading) => set({ isLoading }),

  loadForUser: async (userId) => {
    set({ isLoading: true })
    try {
      const [communities, channels] = await Promise.all([
        fetchUserCommunities(userId),
        fetchAllChannelsForUser(userId),
      ])
      set({ communities, channels, isLoading: false })
      // Auto-select first community + first channel if nothing selected
      const state = get()
      if (!state.currentCommunity && communities.length > 0) {
        const first = communities[0]
        const firstChannel = channels.find((c) => c.communityId === first.id) ?? null
        set({ currentCommunity: first, currentChannel: firstChannel })
      }
    } catch (err) {
      console.error('loadForUser failed:', err)
      set({ isLoading: false })
    }
  },

  loadMembers: async (communityId) => {
    try {
      const members = await fetchMembers(communityId)
      set({ members })
    } catch (err) {
      console.error('loadMembers failed:', err)
    }
  },

  loadRoles: async (communityId) => {
    try {
      const roles = await fetchRoles(communityId)
      set({ roles })
    } catch (err) {
      console.error('loadRoles failed:', err)
    }
  },

  loadCommunity: async (communityId) => {
    try {
      const community = await fetchCommunityById(communityId)
      if (community) {
        set((state) => ({
          currentCommunity: community,
          communities: state.communities.some((c) => c.id === community.id)
            ? state.communities.map((c) => (c.id === community.id ? community : c))
            : [...state.communities, community],
        }))
      }
      return community
    } catch (err) {
      console.error('loadCommunity failed:', err)
      return null
    }
  },

  createCommunity: async (userId, name, description, category) => {
    const { community, channels } = await createCommunityWithDefaults(
      userId,
      name,
      description,
      category
    )
    set((state) => ({
      communities: [...state.communities, community],
      channels: [...state.channels, ...channels],
      currentCommunity: community,
      currentChannel: channels[0] ?? null,
    }))
    return community
  },

  saveCommunity: async (communityId, updates) => {
    const updated = await updateCommunity(communityId, updates)
    get().updateCommunityInState(communityId, updated)
  },

  removeCommunityAction: async (communityId) => {
    await deleteCommunity(communityId)
    get().removeCommunity(communityId)
    if (get().currentCommunity?.id === communityId) {
      const remaining = get().communities[0] ?? null
      set({ currentCommunity: remaining, currentChannel: null })
    }
  },

  createChannelAction: async (communityId, name, type, category) => {
    const channel = await createChannel(communityId, name, type, category)
    get().addChannel(channel)
    return channel
  },

  saveChannel: async (channelId, updates) => {
    const updated = await updateChannel(channelId, updates)
    get().updateChannel(channelId, updated)
    if (get().currentChannel?.id === channelId) {
      set({ currentChannel: updated })
    }
  },

  removeChannelAction: async (channelId) => {
    await deleteChannel(channelId)
    get().removeChannel(channelId)
    if (get().currentChannel?.id === channelId) {
      set({ currentChannel: null })
    }
  },

  createRoleAction: async (communityId, name, color, permissions) => {
    const role = await createRole(communityId, name, color, permissions)
    get().addRole(role)
    return role
  },

  saveRole: async (roleId, updates) => {
    const updated = await updateRole(roleId, updates)
    get().updateRoleInState(roleId, updated)
  },

  removeRoleAction: async (roleId) => {
    await deleteRole(roleId)
    get().removeRole(roleId)
  },

  changeMemberRole: async (memberId, roleId) => {
    await updateMemberRole(memberId, roleId)
    get().updateMemberInState(memberId, { roleId })
  },

  kickMemberAction: async (memberId) => {
    await kickMember(memberId)
    get().removeMemberFromState(memberId)
  },
}))
