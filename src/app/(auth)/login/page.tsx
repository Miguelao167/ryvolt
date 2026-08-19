'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ArrowLeft, Mail, Lock, Chrome, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/app'
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        name="email"
        type="email"
        label="E-mail"
        placeholder="voce@exemplo.com"
        icon={<Mail className="w-4 h-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        name="password"
        type="password"
        label="Senha"
        placeholder="••••••••"
        icon={<Lock className="w-4 h-4" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <div className="flex items-center justify-between">
        <Link
          href="/forgot-password"
          className="text-sm text-discord-blurple hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting}
      >
        {submitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <BrandLogo size="lg" withWordmark />
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-discord-text-muted">
              Entre para acessar suas comunidades
            </p>
          </div>

          {/* Form */}
          <div className="card p-6">
            <Suspense fallback={<div className="h-60 animate-pulse bg-discord-hover rounded-lg" />}>
              <LoginForm />
            </Suspense>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-discord-deep" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-discord-bg text-discord-text-dim">
                ou continue com
              </span>
            </div>
          </div>

          {/* Social login (placeholder for future OAuth) */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled
            title="Login com Google em breve"
          >
            <Chrome className="w-5 h-5" />
            Continuar com Google
          </Button>

          {/* Footer */}
          <p className="text-center text-sm text-discord-text-muted">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-discord-blurple hover:underline font-medium">
              Crie uma
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-discord-blurple/10 to-discord-green/10">
        <div className="relative w-full max-w-lg p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-discord-blurple to-discord-green rounded-3xl blur-3xl opacity-20" />
          <div className="relative">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-white">
                Suas <span className="text-gradient">comunidades</span> estão esperando
              </h2>
              <p className="text-lg text-discord-text-muted">
                Continue de onde parou. Todos os seus servidores, canais e conversas
                em um só lugar.
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Hub de Jogos', members: 1234, online: 89 },
                  { name: 'Conversa de Tech', members: 567, online: 34 },
                  { name: 'Amantes da Música', members: 890, online: 56 },
                ].map((server) => (
                  <div
                    key={server.name}
                    className="flex items-center gap-4 p-3 rounded-xl bg-discord-surface border border-discord-deep"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {server.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{server.name}</div>
                      <div className="text-xs text-discord-text-dim">
                        {server.members.toLocaleString('pt-BR')} membros
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-discord-green" />
                      <span className="text-xs text-discord-text-muted">{server.online} online</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-discord-text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao início
      </Link>
    </div>
  )
}

export default LoginPage
