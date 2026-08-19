'use client'

import { useCallback } from 'react'
import { useVoiceStore } from '@/stores/voiceStore'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'

/**
 * Voice/video call helpers for DM conversations.
 * Uses the same WebRTC voice room as community channels but keyed by
 * `dm:{threadId}` instead of `channel:{channelId}`, so two users in the
 * same DM thread connect to each other.
 */
export function useDMCall() {
  const user = useAuthStore((s) => s.user)
  const join = useVoiceStore((s) => s.join)
  const leave = useVoiceStore((s) => s.leave)
  const activeDMThreadId = useVoiceStore((s) => s.activeDMThreadId)

  const startCall = useCallback(
    async (params: { threadId: string; otherUser: User; withVideo?: boolean }) => {
      if (!user) return
      const { threadId, otherUser, withVideo = false } = params
      await join({
        channelId: `dm-${threadId}`,
        communityId: 'dm',
        selfId: user.id,
        selfDisplayName: user.displayName ?? user.username,
        selfAvatar: user.avatarUrl,
        withVideo,
        dmThreadId: threadId,
        roomName: otherUser.displayName ?? otherUser.username ?? 'Conversa',
      })
    },
    [user, join],
  )

  const endCall = useCallback(() => {
    leave()
  }, [leave])

  const isInCallWithThread = useCallback(
    (threadId: string) => activeDMThreadId === threadId,
    [activeDMThreadId],
  )

  return { startCall, endCall, isInCallWithThread }
}
