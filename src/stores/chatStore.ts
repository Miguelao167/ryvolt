import { create } from 'zustand'
import type { Message } from '@/types'
import { fetchMessages, sendMessage as dbSendMessage } from '@/lib/supabase/queries'

interface ChatState {
  messages: Message[]
  isLoading: boolean
  typingUsers: string[]

  // Actions
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, content: string) => void
  deleteMessage: (messageId: string) => void
  addReaction: (messageId: string, emoji: string, userId: string) => void
  removeReaction: (messageId: string, emoji: string, userId: string) => void
  setTypingUser: (userId: string, isTyping: boolean) => void
  setLoading: (loading: boolean) => void

  // Async
  loadForChannel: (channelId: string) => Promise<void>
  send: (channelId: string, authorId: string, content: string) => Promise<Message | null>
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  typingUsers: [],

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content, editedAt: new Date() } : msg
      ),
    })),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),

  addReaction: (messageId, emoji, userId) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg
        const existing = msg.reactions.find((r) => r.emoji === emoji)
        if (existing) {
          return {
            ...msg,
            reactions: msg.reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, userIds: [...r.userIds, userId], reacted: true }
                : r
            ),
          }
        }
        return {
          ...msg,
          reactions: [...msg.reactions, { emoji, count: 1, userIds: [userId], reacted: true }],
        }
      }),
    })),

  removeReaction: (messageId, emoji, userId) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg
        return {
          ...msg,
          reactions: msg.reactions
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count - 1,
                    userIds: r.userIds.filter((id) => id !== userId),
                    reacted: false,
                  }
                : r
            )
            .filter((r) => r.count > 0),
        }
      }),
    })),

  setTypingUser: (userId, isTyping) =>
    set((state) => {
      const next = isTyping
        ? Array.from(new Set([...state.typingUsers, userId]))
        : state.typingUsers.filter((id) => id !== userId)
      return { typingUsers: next }
    }),

  setLoading: (isLoading) => set({ isLoading }),

  loadForChannel: async (channelId) => {
    set({ isLoading: true, messages: [] })
    try {
      const messages = await fetchMessages(channelId)
      set({ messages, isLoading: false })
    } catch (err) {
      console.error('loadForChannel failed:', err)
      set({ isLoading: false })
    }
  },

  send: async (channelId, authorId, content) => {
    try {
      const msg = await dbSendMessage(channelId, authorId, content)
      set((state) => ({ messages: [...state.messages, msg] }))
      return msg
    } catch (err) {
      console.error('send failed:', err)
      return null
    }
  },
}))
