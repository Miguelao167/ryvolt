'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useIsSpeaking } from '@/hooks/useIsSpeaking'

interface SpeakingAvatarProps {
  userId?: string | null
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'idle' | 'dnd' | 'offline' | null
  shape?: 'square' | 'circle'
  className?: string
}

/**
 * Avatar com borda verde pulsante quando o usuário está falando
 * no canal de voz ativo. Subscreve ao voiceStore (apenas a flag
 * `speaking`) e re-renderiza de forma eficiente.
 */
export function SpeakingAvatar({
  userId,
  src,
  alt,
  size = 'md',
  status,
  shape = 'square',
  className,
}: SpeakingAvatarProps) {
  const speaking = useIsSpeaking(userId)

  return (
    <div className={cn('relative inline-block', className)}>
      <AnimatePresence>
        {speaking && (
          <>
            {/* Anel externo — gradiente verde com glow pulsante */}
            <motion.div
              key="ring-outer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0.85, 1, 0.85],
                scale: [1, 1.08, 1],
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: shape === 'circle' ? '9999px' : '1rem',
                boxShadow:
                  '0 0 0 2px rgb(34, 197, 94), 0 0 12px rgba(34, 197, 94, 0.6), 0 0 24px rgba(34, 197, 94, 0.3)',
              }}
            />
            {/* Anel interno sutil — preenche o padding do Avatar */}
            <motion.div
              key="ring-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: shape === 'circle' ? '9999px' : '1rem',
                background:
                  'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.04))',
              }}
            />
          </>
        )}
      </AnimatePresence>

      <Avatar
        src={src}
        alt={alt}
        size={size}
        status={status}
        shape={shape}
        className="relative z-10"
      />
    </div>
  )
}