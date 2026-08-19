'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, ImageIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  /** Current image URL (used for preview) */
  value?: string | null
  /** Called with the new URL after a successful upload */
  onChange: (url: string | null) => void
  /** Variant of UI — avatar round preview vs. banner wide preview */
  variant?: 'avatar' | 'banner' | 'square'
  /** Optional fallback (e.g. initials shown if no image) */
  fallback?: string
  /** Disable the picker */
  disabled?: boolean
  /** Called when the user picks a file — return a promise that resolves to the new URL */
  onUpload: (file: File) => Promise<string>
  /** Optional className on the wrapper */
  className?: string
  /** Optional alt text */
  alt?: string
}

export function ImageUploader({
  value,
  onChange,
  variant = 'avatar',
  fallback,
  onUpload,
  disabled,
  className,
  alt = '',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Imagem maior que 8MB — escolha outra')
      return
    }
    setUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
      toast.success('Imagem atualizada')
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha no upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(null)
  }

  const open = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  // ── Render variants ─────────────────────────────────────
  if (variant === 'avatar') {
    return (
      <div className={cn('flex items-start gap-4', className)}>
        <div
          onClick={open}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'relative group rounded-full cursor-pointer shrink-0 transition-all',
            'border-2 border-dashed',
            dragOver
              ? 'border-discord-blurple bg-discord-blurple/10'
              : 'border-discord-deep hover:border-discord-blurple',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Avatar src={value ?? undefined} alt={alt || fallback || ''} size="xl" />
          <div
            className={cn(
              'absolute inset-0 rounded-full flex items-center justify-center bg-black/50 transition-opacity',
              hovering || uploading || dragOver ? 'opacity-100' : 'opacity-0',
            )}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-white" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-sm font-medium text-white">
            Foto do servidor
          </div>
          <p className="text-xs text-discord-text-dim mb-2">
            PNG, JPG ou GIF até 8MB. Clique ou arraste a imagem.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={open}
              disabled={disabled || uploading}
              className="text-xs px-3 py-1.5 rounded-md bg-discord-blurple text-white hover:bg-discord-blurple-hover disabled:opacity-50"
            >
              {value ? 'Trocar imagem' : 'Enviar imagem'}
            </button>
            {value && (
              <button
                type="button"
                onClick={clear}
                disabled={disabled}
                className="text-xs px-3 py-1.5 rounded-md text-discord-text-dim hover:text-white hover:bg-discord-hover flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Remover
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={cn('space-y-2', className)}>
        <div
          onClick={open}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'relative h-32 rounded-lg cursor-pointer overflow-hidden group',
            'border-2 border-dashed',
            dragOver
              ? 'border-discord-blurple'
              : 'border-discord-deep hover:border-discord-blurple',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          style={{
            backgroundImage: value
              ? `url(${value})`
              : 'linear-gradient(135deg, #5865F2/30, #23FF89/30)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity',
              hovering || uploading || dragOver ? 'opacity-100' : 'opacity-0',
            )}
          >
            <div className="flex flex-col items-center gap-1 text-white">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
              <span className="text-xs font-medium">
                {value ? 'Trocar banner' : 'Enviar banner'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={open}
            disabled={disabled || uploading}
            className="text-xs px-3 py-1.5 rounded-md bg-discord-blurple text-white hover:bg-discord-blurple-hover disabled:opacity-50"
          >
            {value ? 'Trocar banner' : 'Enviar banner'}
          </button>
          {value && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="text-xs px-3 py-1.5 rounded-md text-discord-text-dim hover:text-white hover:bg-discord-hover flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Remover
            </button>
          )}
          <span className="text-xs text-discord-text-dim">
            PNG, JPG ou GIF até 8MB
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    )
  }

  // square variant — generic tile
  return (
    <div
      onClick={open}
      className={cn(
        'relative cursor-pointer group',
        'border-2 border-dashed border-discord-deep hover:border-discord-blurple',
        'rounded-lg overflow-hidden flex items-center justify-center',
        dragOver && 'border-discord-blurple bg-discord-blurple/10',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {value ? (
        <img src={value} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="w-8 h-8 text-discord-text-dim" />
      )}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity',
          hovering || uploading || dragOver ? 'opacity-100' : 'opacity-0',
        )}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-white" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
