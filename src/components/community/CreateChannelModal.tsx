'use client'

import { useState } from 'react'
import { Hash, Volume2, Video, Megaphone, BookOpen, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui'
import type { ChannelType } from '@/types'

interface CreateChannelModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: { name: string; type: ChannelType; category: string | null; isPrivate: boolean; topic: string | null }) => Promise<void> | void
  /** Categorias existentes pra sugestão */
  existingCategories?: string[]
  defaultCategory?: string | null
}

const CHANNEL_TYPES: { type: ChannelType; label: string; description: string; icon: any; color: string }[] = [
  { type: 'text', label: 'Texto', description: 'Mensagens, imagens e arquivos', icon: Hash, color: 'text-slate-400' },
  { type: 'voice', label: 'Voz', description: 'Conversa por voz em tempo real', icon: Volume2, color: 'text-emerald-400' },
  { type: 'video', label: 'Vídeo', description: 'Chamada de vídeo + voz', icon: Video, color: 'text-violet-400' },
  { type: 'announcement', label: 'Avisos', description: 'Só admins podem enviar', icon: Megaphone, color: 'text-yellow-400' },
  { type: 'forum', label: 'Fórum', description: 'Threads com tópicos', icon: BookOpen, color: 'text-orange-400' },
]

/**
 * Modal estilo Discord pra criar canal. Suporta:
 * - Tipos: text, voice, video, announcement, forum
 * - Categoria (digitando livre ou escolhendo existente)
 * - Canal privado (só membros com cargo específico)
 * - Tópico/descrição (opcional)
 */
export function CreateChannelModal({
  open,
  onClose,
  onCreate,
  existingCategories = [],
  defaultCategory = null,
}: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ChannelType>('text')
  const [category, setCategory] = useState<string>(defaultCategory ?? '')
  const [isPrivate, setIsPrivate] = useState(false)
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setType('text')
    setCategory(defaultCategory ?? '')
    setIsPrivate(false)
    setTopic('')
    setError(null)
    setSubmitting(false)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const slugified = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await onCreate({
        name: slugified || trimmed.toLowerCase().replace(/\s+/g, '-'),
        type,
        category: category.trim() || null,
        isPrivate,
        topic: topic.trim() || null,
      })
      reset()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao criar canal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && handleClose()}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>Criar canal</ModalTitle>
        </ModalHeader>

        <div className="space-y-4">
          {/* Tipo de canal */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-discord-text-dim">
              Tipo de canal
            </label>
            <div className="space-y-1.5">
              {CHANNEL_TYPES.map((t) => {
                const Icon = t.icon
                const active = t.type === type
                return (
                  <button
                    key={t.type}
                    onClick={() => setType(t.type)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left',
                      active
                        ? 'border-discord-blurple bg-discord-blurple/10'
                        : 'border-discord-deep hover:border-discord-surface2 hover:bg-discord-hover'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 shrink-0', t.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">
                        {t.label}
                      </div>
                      <div className="text-xs text-discord-text-dim truncate">
                        {t.description}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 shrink-0',
                        active
                          ? 'border-discord-blurple bg-discord-blurple'
                          : 'border-discord-deep'
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nome */}
          <div>
            <Input
              label="Nome do canal"
              placeholder="novo-canal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && !submitting) {
                  e.preventDefault()
                  handleCreate()
                }
              }}
              autoFocus
            />
            {slugified && slugified !== name.toLowerCase() && (
              <p className="text-xs text-discord-text-dim mt-1">
                Será criado como <code className="px-1 py-0.5 rounded bg-discord-surface text-discord-text-muted">#{slugified}</code>
              </p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-discord-text-muted mb-1.5">
              Categoria <span className="text-discord-text-dim text-xs">(opcional)</span>
            </label>
            <input
              list="categories-list"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ex: Geral, Discussão, Suporte"
              className="w-full px-3 py-2 text-sm rounded-md bg-discord-bg border border-discord-deep text-white placeholder:text-discord-text-dim focus:outline-none focus:border-discord-blurple"
            />
            <datalist id="categories-list">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Tópico (só pra text/announcement/forum) */}
          {(type === 'text' || type === 'announcement' || type === 'forum') && (
            <div>
              <label className="block text-sm font-medium text-discord-text-muted mb-1.5">
                Tópico <span className="text-discord-text-dim text-xs">(opcional)</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
                placeholder="Do que se trata esse canal?"
                className="w-full px-3 py-2 text-sm rounded-md bg-discord-bg border border-discord-deep text-white placeholder:text-discord-text-dim focus:outline-none focus:border-discord-blurple resize-none"
              />
            </div>
          )}

          {/* Privado */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={cn(
                'w-9 h-5 rounded-full relative transition-colors',
                isPrivate ? 'bg-discord-blurple' : 'bg-discord-deep'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                  isPrivate ? 'translate-x-[18px]' : 'translate-x-0.5'
                )}
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Lock className="w-4 h-4 text-discord-text-dim" />
              <div>
                <div className="text-sm text-white">Canal privado</div>
                <div className="text-xs text-discord-text-dim">
                  Só quem tiver cargo específico pode ver e entrar
                </div>
              </div>
            </div>
          </label>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || submitting}>
            {submitting ? 'Criando…' : 'Criar canal'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}
