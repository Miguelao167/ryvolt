'use client'

import { useCallback } from 'react'
import { useVoiceStore } from '@/stores/voiceStore'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'

/**
 * Convenience hook to join/leave voice/video channels from anywhere
 * in the app (channel list, chat area, etc.).
 */
export function useVoiceConnection() {
  const user = useAuthStore((s) => s.user)
  const activeCommunity = useCommunityStore((s) => s.currentCommunity)
  const join = useVoiceStore((s) => s.join)
  const leave = useVoiceStore((s) => s.leave)
  const activeChannelId = useVoiceStore((s) => s.activeChannelId)

  const joinVoice = useCallback(
    async (channelId: string, opts?: { video?: boolean }) => {
      if (!user || !activeCommunity) return
      await join({
        channelId,
        communityId: activeCommunity.id,
        selfId: user.id,
        selfDisplayName: user.displayName ?? user.username,
        selfAvatar: user.avatarUrl,
        withVideo: !!opts?.video,
      })
    },
    [user, activeCommunity, join],
  )

  const leaveVoice = useCallback(() => {
    leave()
  }, [leave])

  const isInChannel = useCallback(
    (channelId: string) => activeChannelId === channelId,
    [activeChannelId],
  )

  return { joinVoice, leaveVoice, isInChannel }
}