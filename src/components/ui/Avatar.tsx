'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

export interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'idle' | 'dnd' | 'offline' | null
  /** 'square' (default) = logo quadrada arredondada com padding interno.
   *  'circle' = estilo Discord, foto preenche 100%. */
  shape?: 'square' | 'circle'
  className?: string
}

const sizes = {
  xs: { dimension: 20, fontSize: 'text-[8px]' },
  sm: { dimension: 24, fontSize: 'text-[10px]' },
  md: { dimension: 32, fontSize: 'text-xs' },
  lg: { dimension: 40, fontSize: 'text-sm' },
  xl: { dimension: 48, fontSize: 'text-base' },
  '2xl': { dimension: 80, fontSize: 'text-2xl' },
}

const statusColors = {
  online: 'bg-discord-green',
  idle: 'bg-discord-yellow',
  dnd: 'bg-discord-red',
  offline: 'bg-discord-text-dim',
}

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
}

/**
 * Avatar — formato de logo (quadrado arredondado) por padrão, com
 * padding interno generoso pra foto respirar como uma logo de app.
 *
 * - shape="square" (default): rounded-2xl, padding interno (8%),
 *   object-contain pra foto não cortar. Estilo logo/splash.
 * - shape="circle": rounded-full, foto preenche 100%. Estilo Discord.
 */
const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size = 'md', status, shape = 'square', className }, ref) => {
    const { dimension, fontSize } = sizes[size]
    const initials = getInitials(alt)

    const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0',
          radiusClass,
          // Fundo sempre presente: quando a foto não carrega ou é clara demais,
          // garante contraste (estilo Spotify/Discord avatar)
          'bg-discord-surface',
          className
        )}
        style={{
          width: dimension,
          height: dimension,
        }}
      >
        {src ? (
          // Imagem preenche 100% (estilo Discord)
          <Image
            src={src}
            alt={alt}
            fill
            sizes={`${dimension}px`}
            className={cn(
              shape === 'circle' ? 'object-cover' : 'object-cover'
            )}
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              'bg-discord-blurple',
              'text-white font-semibold',
              radiusClass,
              fontSize
            )}
          >
            {initials}
          </div>
        )}

        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full',
              'ring-2 ring-discord-bg',
              statusColors[status],
              statusSizes[size]
            )}
          />
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export interface CommunityAvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  shape?: 'square' | 'circle'
  className?: string
}

const communitySizes = {
  sm: { dimension: 24, fontSize: 'text-[10px]' },
  md: { dimension: 48, fontSize: 'text-sm' },
  lg: { dimension: 80, fontSize: 'text-xl' },
}

const CommunityAvatar = forwardRef<HTMLDivElement, CommunityAvatarProps>(
  ({ src, name, size = 'md', shape = 'square', className }, ref) => {
    const { dimension, fontSize } = communitySizes[size]
    const initials = getInitials(name)
    const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0',
          radiusClass,
          'bg-discord-surface',
          className
        )}
        style={{
          width: dimension,
          height: dimension,
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            sizes={`${dimension}px`}
            className="object-cover"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              'bg-discord-blurple',
              'text-white font-semibold',
              radiusClass,
              fontSize
            )}
          >
            {initials}
          </div>
        )}
      </div>
    )
  }
)
CommunityAvatar.displayName = 'CommunityAvatar'

export { Avatar, CommunityAvatar }