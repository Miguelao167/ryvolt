'use client'

import { useVoiceStore } from '@/stores/voiceStore'

/**
 * Returns whether the given userId is currently speaking in the active voice room.
 * Subscribes only to the participant's `speaking` flag, so it doesn't re-render
 * the whole list when unrelated participants change.
 */
export function useIsSpeaking(userId: string | undefined | null): boolean {
  return useVoiceStore((s) => {
    if (!userId) return false
    const p = s.participants.get(userId)
    return p?.speaking ?? false
  })
}