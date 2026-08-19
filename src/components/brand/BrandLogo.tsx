'use client'

import { cn } from '@/lib/utils'

type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface BrandLogoProps {
  /** Tamanho do quadrado externo em pixels. Mantém proporção 1:1 (logo). */
  size?: BrandLogoSize
  /** Se true, mostra a palavra "RYVOLT" do lado direito. */
  withWordmark?: boolean
  /** Se true, usa tamanho "text" maior pra wordmark. */
  prominentWordmark?: boolean
  /** Use 'image' (default) pra imagem real da logo ou 'svg' pra fallback vetorial. */
  variant?: 'image' | 'svg'
  className?: string
}

const SIZE_MAP: Record<
  BrandLogoSize,
  { box: string; icon: string; wordmark: string }
> = {
  sm: { box: 'w-8 h-8', icon: 'text-sm', wordmark: 'text-sm' },
  md: { box: 'w-10 h-10', icon: 'text-lg', wordmark: 'text-lg' },
  lg: { box: 'w-12 h-12', icon: 'text-2xl', wordmark: 'text-xl' },
  xl: { box: 'w-16 h-16', icon: 'text-4xl', wordmark: 'text-3xl' },
}

/**
 * BrandLogo — logo oficial da RYVOLT.
 *
 * - variant="image" (default): usa /ryvolt-logo.png (o beast roxo com olhos brilhantes)
 * - variant="svg": usa o "R" estilizado antigo como fallback quando a imagem não carrega
 *
 * Visual: quadrado com cantos arredondados (2xl) com a logo centralizada
 * em object-contain pra preservar proporção e fundo transparente.
 */
export function BrandLogo({
  size = 'md',
  withWordmark = false,
  prominentWordmark = false,
  variant = 'image',
  className,
}: BrandLogoProps) {
  const dims = SIZE_MAP[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          dims.box,
          'relative shrink-0 rounded-2xl overflow-hidden',
          'bg-discord-surface',
          'shadow-lg shadow-discord-blurple/20',
          'flex items-center justify-center'
        )}
        aria-label="RYVOLT"
      >
        {variant === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/ryvolt-logo.png?v=2"
            alt="RYVOLT"
            className="w-[85%] h-[85%] object-contain"
            draggable={false}
          />
        ) : (
          <svg
            viewBox="0 0 32 32"
            className={cn(
              'w-[60%] h-[60%] text-discord-blurple drop-shadow-sm'
            )}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M9 6h10.5c3.6 0 6 2.4 6 6 0 2.4-1.2 4.3-3.1 5.3l3.6 8.7h-5.2l-3-7.6h-3.8V26H9V6Zm5 8h5.4c1.4 0 2.4-.9 2.4-2.4 0-1.4-1-2.4-2.4-2.4H14v4.8Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>

      {withWordmark && (
        <span
          className={cn(
            prominentWordmark ? dims.wordmark : dims.wordmark,
            'font-bold tracking-tight text-white'
          )}
        >
          RYVOLT
        </span>
      )}
    </div>
  )
}
