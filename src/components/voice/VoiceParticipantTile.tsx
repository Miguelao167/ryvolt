'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MicOff, VideoOff } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import type { Participant } from '@/lib/webrtc'

interface VoiceParticipantTileProps {
  participant: Participant
  /** Whether this tile is for the local user (mutes own video preview to avoid feedback) */
  isSelf?: boolean
  /** Whether to show video */
  showVideo?: boolean
  /** Larger size for "speaker focus" layout */
  featured?: boolean
  onClick?: () => void
}

export function VoiceParticipantTile({
  participant,
  isSelf = false,
  showVideo = false,
  featured = false,
  onClick,
}: VoiceParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Attach remote stream to <video> element
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const stream = participant.stream ?? null
    if (stream && stream !== el.srcObject) {
      el.srcObject = stream
      el.muted = isSelf // prevent echo from own audio
      void el.play().catch(() => undefined)
    }
    return () => {
      if (el) el.srcObject = null
    }
  }, [participant.stream, isSelf])

  const hasVideo =
    showVideo &&
    !participant.videoOff &&
    participant.stream &&
    participant.stream.getVideoTracks().some((t) => t.enabled)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer',
        'bg-gradient-to-br from-discord-surface to-discord-hover',
        'border border-discord-deep',
        featured
          ? 'aspect-video w-full'
          : 'aspect-square w-full',
      )}
    >
      {/* Video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          data-participant-id={participant.userId}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Speaking ring */}
            {participant.speaking && (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: '0 0 0 4px #23FF89, 0 0 24px #23FF89',
                }}
              />
            )}
            <Avatar
              src={participant.avatarUrl ?? undefined}
              alt={participant.displayName}
              size={featured ? 'xl' : 'lg'}
              className="relative z-10"
            />
          </div>
        </div>
      )}

      {/* Speaking pulse overlay (subtle) */}
      {participant.speaking && (
        <motion.div
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, #23FF89 / 0.15, transparent 60%)',
          }}
        />
      )}

      {/* Overlay: name + status icons */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white font-medium text-sm truncate">
              {participant.displayName}
              {isSelf && <span className="text-white/60"> (you)</span>}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {participant.muted && (
              <div className="w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            {participant.videoOff && showVideo && (
              <div className="w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection state badge (top-right) */}
      {participant.state === 'connecting' && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-yellow-500/90 text-xs text-white font-medium">
          Connecting...
        </div>
      )}
      {participant.state === 'failed' && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-red-500/90 text-xs text-white font-medium">
          Reconnecting
        </div>
      )}
    </motion.div>
  )
}