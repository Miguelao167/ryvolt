'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Loader2, UserPlus } from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { createInvite, listInvites } from '@/lib/supabase/queries'
import type { Invite } from '@/types'

interface InviteModalProps {
  communityId: string
  communityName: string
  onClose: () => void
}

export function InviteModal({ communityId, communityName, onClose }: InviteModalProps) {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(true)
  const [maxUses, setMaxUses] = useState<string>('')
  const [expiresInHours, setExpiresInHours] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteUrl = createdInvite
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${createdInvite.code}`
    : ''

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleCreate = async () => {
    if (!user?.id) return
    setCreating(true)
    setError(null)
    try {
      const opts: { maxUses?: number | null; expiresInHours?: number | null } = {}
      if (maxUses.trim()) {
        const n = parseInt(maxUses, 10)
        if (Number.isFinite(n) && n > 0) opts.maxUses = n
      }
      if (expiresInHours.trim()) {
        const n = parseInt(expiresInHours, 10)
        if (Number.isFinite(n) && n > 0) opts.expiresInHours = n
      }
      const invite = await createInvite(communityId, user.id, opts)
      setCreatedInvite(invite)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create invite')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback */
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(onClose, 150)
  }

  return (
    <Modal open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <ModalContent size="md">
        <ModalHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-discord-blurple" />
            <ModalTitle>Convidar pessoas para {communityName}</ModalTitle>
          </div>
          <ModalDescription>
            Compartilhe este link para dar acesso à comunidade.
          </ModalDescription>
        </ModalHeader>

        {!createdInvite ? (
          <>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Máximo de usos (opcional)"
                  placeholder="Ilimitado"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  disabled={creating}
                />
                <Input
                  label="Expira em (horas, opcional)"
                  placeholder="Nunca"
                  type="number"
                  min="1"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  disabled={creating}
                />
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={handleClose} disabled={creating}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando…
                  </>
                ) : (
                  'Gerar convite'
                )}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody>
              <div className="space-y-3">
                <p className="text-sm text-discord-text-muted">
                  Seu link de convite está pronto. Compartilhe com quem você quiser.
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 bg-discord-bg border border-discord-deep rounded-lg px-3 py-2 text-sm text-white font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button onClick={handleCopy} variant="secondary">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg bg-discord-hover p-3 text-xs text-discord-text-dim">
                  {createdInvite.max_uses && <p>Máximo de usos: {createdInvite.max_uses}</p>}
                  {createdInvite.expires_at && (
                    <p>Expira em: {new Date(createdInvite.expires_at).toLocaleString('pt-BR')}</p>
                  )}
                  {!createdInvite.max_uses && !createdInvite.expires_at && (
                    <p>Sem expiração, usos ilimitados.</p>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setCreatedInvite(null)}>
                Criar outro
              </Button>
              <Button onClick={handleClose}>Pronto</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
