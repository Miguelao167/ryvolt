'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Grid2x2,
  Grid3x3,
  Focus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Layout = 'auto' | 'grid' | 'focus'

interface VideoOverlayProps {
  /** Currently focused participant id (null = grid) */
  focusedId: string | null
  onFocus: (id: string | null) => void
  /** Container for fullscreen */
  containerRef: React.RefObject<HTMLElement>
}

export function VideoOverlay({
  focusedId,
  onFocus,
  containerRef,
}: VideoOverlayProps) {
  const [layout, setLayout] = useState<Layout>('auto')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pipParticipantId, setPipParticipantId] = useState<string | null>(null)
  const containerEl = containerRef.current

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = async () => {
    if (!containerEl) return
    if (!document.fullscreenElement) {
      await containerEl.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  }

  const togglePip = async (participantId: string) => {
    // Find the video element for this participant
    const video = document.querySelector<HTMLVideoElement>(
      `video[data-participant-id="${participantId}"]`,
    )
    if (!video) return
    try {
      const pip = document.pictureInPictureElement as HTMLVideoElement | null
      if (pip === video) {
        await (document as any).exitPictureInPicture()
        setPipParticipantId(null)
      } else {
        await (video as any).requestPictureInPicture()
        setPipParticipantId(participantId)
      }
    } catch (err) {
      console.warn('PiP failed', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 right-4 flex items-center gap-1 p-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
    >
      <LayoutButton
        active={layout === 'auto'}
        onClick={() => setLayout('auto')}
        title="Auto layout"
      >
        <Grid3x3 className="w-4 h-4" />
      </LayoutButton>

      <LayoutButton
        active={layout === 'grid'}
        onClick={() => setLayout('grid')}
        title="Grid layout"
      >
        <Grid2x2 className="w-4 h-4" />
      </LayoutButton>

      <LayoutButton
        active={layout === 'focus'}
        onClick={() => {
          setLayout('focus')
          if (!focusedId) onFocus(null)
        }}
        title="Speaker focus"
      >
        <Focus className="w-4 h-4" />
      </LayoutButton>

      {focusedId && (
        <LayoutButton
          onClick={() => togglePip(focusedId)}
          active={pipParticipantId === focusedId}
          title="Picture in picture"
        >
          <PictureInPicture2 className="w-4 h-4" />
        </LayoutButton>
      )}

      <LayoutButton
        onClick={toggleFullscreen}
        active={isFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </LayoutButton>
    </motion.div>
  )
}

function LayoutButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
        active
          ? 'bg-white/20 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

/**
 * Helper hook to focus a participant and select featured layout
 */
export function useFocusParticipant() {
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const focus = (id: string | null) => setFocusedId(id)
  return { focusedId, focus }
}