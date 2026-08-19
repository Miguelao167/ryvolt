'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Headphones,
  VolumeX,
  PhoneOff,
  Video,
  VideoOff,
  Settings,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceStore } from '@/stores/voiceStore'
import { useAuthStore } from '@/stores/authStore'
import { DeviceSelector } from './DeviceSelector'

export function VoiceControls() {
  const [showDevices, setShowDevices] = useState(false)
  const [muted, setMuted] = useState(false)
  const [deafened, setDeafened] = useState(false)
  const [videoOff, setVideoOff] = useState(true)

  const setMutedStore = useVoiceStore((s) => s.setMuted)
  const setDeafenedStore = useVoiceStore((s) => s.setDeafened)
  const setVideoOffStore = useVoiceStore((s) => s.setVideoOff)
  const leave = useVoiceStore((s) => s.leave)
  const activeChannelId = useVoiceStore((s) => s.activeChannelId)
  const userId = useAuthStore((s) => s.user?.id)

  if (!activeChannelId || !userId) return null

  const handleToggleMute = () => {
    const next = !muted
    setMuted(next)
    setMutedStore(next)
  }

  const handleToggleDeafen = () => {
    const next = !deafened
    setDeafened(next)
    setDeafenedStore(next)
  }

  const handleToggleVideo = () => {
    const next = !videoOff
    setVideoOff(next)
    setVideoOffStore(!next) // setVideoOff(true) means OFF
  }

  return (
    <div className="relative">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'flex items-center justify-center gap-2 p-3 rounded-2xl',
          'bg-discord-surface/95 backdrop-blur-xl',
          'border border-discord-deep',
          'shadow-2xl shadow-black/40',
        )}
      >
        <ControlButton
          active={!muted}
          onClick={handleToggleMute}
          danger={muted}
          tooltip={muted ? 'Unmute' : 'Mute'}
          iconOn={<Mic className="w-5 h-5" />}
          iconOff={<MicOff className="w-5 h-5" />}
        />

        <ControlButton
          active={!deafened}
          onClick={handleToggleDeafen}
          danger={deafened}
          tooltip={deafened ? 'Undeafen' : 'Deafen'}
          iconOn={<Headphones className="w-5 h-5" />}
          iconOff={<VolumeX className="w-5 h-5" />}
        />

        <ControlButton
          active={!videoOff}
          onClick={handleToggleVideo}
          danger={videoOff}
          tooltip={videoOff ? 'Turn on camera' : 'Turn off camera'}
          iconOn={<Video className="w-5 h-5" />}
          iconOff={<VideoOff className="w-5 h-5" />}
        />

        <ControlButton
          onClick={() => setShowDevices((v) => !v)}
          active={showDevices}
          tooltip="Settings"
          iconOn={<Settings className="w-5 h-5" />}
          iconOff={<Settings className="w-5 h-5" />}
        />

        <button
          onClick={leave}
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center',
            'bg-red-500 hover:bg-red-600 text-white transition-colors',
          )}
          aria-label="Disconnect"
          title="Disconnect"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </motion.div>

      <AnimatePresence>
        {showDevices && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72"
          >
            <DeviceSelector onClose={() => setShowDevices(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ControlButtonProps {
  active: boolean
  onClick: () => void
  danger?: boolean
  tooltip: string
  iconOn: React.ReactNode
  iconOff: React.ReactNode
}

function ControlButton({
  active,
  onClick,
  danger,
  tooltip,
  iconOn,
  iconOff,
}: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip}
      className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center transition-all',
        'border border-transparent',
        danger
          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border-red-500/30'
          : active
            ? 'bg-discord-blurple/15 text-discord-blurple hover:bg-discord-blurple/25'
            : 'bg-discord-hover text-discord-text-muted hover:bg-discord-surface hover:text-white',
      )}
    >
      {active ? iconOn : iconOff}
    </button>
  )
}

// Helper icon used in other places
export function MonitorIcon({ className }: { className?: string }) {
  return <Monitor className={className} />
}