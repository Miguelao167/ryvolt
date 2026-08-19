'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { CheckCircle2, AlertCircle, Loader2, Users, Sparkles } from 'lucide-react'
import { fetchInviteByCode, acceptInvite, type InvitePreviewResult } from '@/lib/supabase/queries'
import { useAuthStore } from '@/stores/authStore'
import type { Community } from '@/types'

export default function InvitePage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const [preview, setPreview] = useState<InvitePreviewResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joinedCommunityId, setJoinedCommunityId] = useState<string | null>(null)

  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    let cancelled = false
    const { code } = params
    ;(async () => {
      try {
        const result = await fetchInviteByCode(code)
        if (!cancelled) {
          setPreview(result)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load invite')
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [params.code])

  const handleJoin = async () => {
    if (!user?.id) return
    setSubmitting(true)
    setError(null)
    try {
      const { communityId } = await acceptInvite(params.code, user.id)
      setJoinedCommunityId(communityId)
      // Give the toast/state a moment, then redirect
      setTimeout(() => {
        router.push(`/app`)
        router.refresh()
      }, 800)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to join')
      setSubmitting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <Centered>
        <Loader2 className="w-10 h-10 animate-spin text-discord-blurple" />
        <p className="mt-4 text-discord-text-muted">Carregando convite…</p>
      </Centered>
    )
  }

  if (!preview || preview.status === 'invalid') {
    return (
      <Centered>
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Convite inválido</h1>
        <p className="mt-2 text-discord-text-muted">
          Este link de convite é inválido ou foi excluído.
        </p>
        <Link href="/" className="mt-6">
          <Button variant="secondary">Voltar ao início</Button>
        </Link>
      </Centered>
    )
  }

  if (preview.status === 'expired') {
    return (
      <Centered>
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold">Convite expirado</h1>
        <p className="mt-2 text-discord-text-muted">
          Peça um novo link ao dono do servidor.
        </p>
      </Centered>
    )
  }

  if (preview.status === 'maxed') {
    return (
      <Centered>
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold">Convite esgotado</h1>
        <p className="mt-2 text-discord-text-muted">
          Este convite atingiu o limite de usos.
        </p>
      </Centered>
    )
  }

  const community: Community | null = preview.community
  if (!community) {
    return (
      <Centered>
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Comunidade não encontrada</h1>
      </Centered>
    )
  }

  if (joinedCommunityId) {
    return (
      <Centered>
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold">Bem-vindo!</h1>
        <p className="mt-2 text-discord-text-muted">
          Entrando em <strong>{community.name}</strong>…
        </p>
      </Centered>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-bg p-6">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-discord-blurple to-discord-green mx-auto flex items-center justify-center text-3xl font-bold text-white">
            {community.iconUrl ? (
              <img src={community.iconUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              community.name[0].toUpperCase()
            )}
          </div>

          <h1 className="mt-6 text-2xl font-bold text-white">
            Você foi convidado para {community.name}
          </h1>
          {community.description && (
            <p className="mt-2 text-discord-text-muted">
              {community.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-discord-text-dim">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {community.memberCount.toLocaleString('pt-BR')} membros
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {community.category}
            </span>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            {!user ? (
              <>
                <p className="text-sm text-discord-text-muted">
                  Entre ou crie uma conta para participar.
                </p>
                <div className="flex gap-3">
                  <Link href={`/login?redirect=/invite/${params.code}`} className="flex-1">
                    <Button variant="secondary" className="w-full">Entrar</Button>
                  </Link>
                  <Link href={`/register?redirect=/invite/${params.code}`} className="flex-1">
                    <Button className="w-full">Criar conta</Button>
                  </Link>
                </div>
              </>
            ) : (
              <Button
                size="lg"
                onClick={handleJoin}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando…
                  </>
                ) : (
                  <>Aceitar convite</>
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-discord-text-dim">
          Código do convite: <code className="font-mono">{params.code}</code>
        </p>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-bg p-6">
      <div className="text-center max-w-md">{children}</div>
    </div>
  )
}
