'use client'

import { VoiceCallView } from './VoiceCallView'
import { useVoiceStore } from '@/stores/voiceStore'
import type { ConnectionState } from '@/lib/webrtc'

interface VoiceChannelViewProps {
  channelId: string
  communityId: string
  channelName: string
  /** Show video grid instead of audio-only tiles */
  showVideo?: boolean
}

/**
 * Backwards-compatible community-channel voice view.
 * Delegates to the unified VoiceCallView.
 */
export function VoiceChannelView({
  channelId,
  communityId,
  channelName,
  showVideo = false,
}: VoiceChannelViewProps) {
  return (
    <VoiceCallView
      channelId={channelId}
      communityId={communityId}
      callName={channelName}
      showVideo={showVideo}
    />
  )
}

// Re-export the unified view so other parts of the app can use it directly.
export { VoiceCallView }

// Also re-export the connection state for appShell usage
export function useCallConnectionState(): ConnectionState {
  return useVoiceStore((s) => s.connectionState)
}
