'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ArrowLeft, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Suspense } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/app'
  const signUp = useAuthStore((s) => s.signUp)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (password.length < 8) {
      setError('Senha precisa ter pelo menos 8 caracteres')
      return
    }
    if (username.length < 3) {
      setError('Username precisa ter pelo menos 3 caracteres')
      return
    }

    setSubmitting(true)
    const { error } = await signUp(
      email.trim(),
      password,
      username.trim(),
      displayName.trim() || username.trim()
    )
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
        name="username"
        type="text"
        label="Nome de usuário"
        placeholder="usuariolegal123"
        icon={<User className="w-4 h-4" />}
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        required
        autoComplete="username"
        hint="Letras minúsculas, números e underline"
      />
      <Input
        name="displayName"
        type="text"
        label="Nome de exibição (opcional)"
        placeholder="Como você quer ser chamado"
        icon={<User className="w-4 h-4" />}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        autoComplete="name"
      />
      <Input
        name="password"
        type="password"
        label="Senha"
        placeholder="••••••••"
        icon={<Lock className="w-4 h-4" />}
        hint="Pelo menos 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      <Input
        name="confirmPassword"
        type="password"
        label="Confirmar senha"
        placeholder="••••••••"
        icon={<Lock className="w-4 h-4" />}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting}
      >
        {submitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}

function RegisterPage() {
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
              Crie sua conta
            </h1>
            <p className="mt-2 text-discord-text-muted">
              Entre na comunidade e comece a se conectar
            </p>
          </div>

          {/* Form */}
          <div className="card p-6">
            <Suspense fallback={<div className="h-80 animate-pulse bg-discord-hover rounded-lg" />}>
              <RegisterForm />
            </Suspense>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-discord-text-muted">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-discord-blurple hover:underline font-medium">
              Entrar
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
                Conecte-se com <span className="text-gradient">comunidades</span> do mundo todo
              </h2>
              <p className="text-lg text-discord-text-muted">
                Crie seu próprio espaço, convide amigos e construa conexões reais
                por texto, voz e vídeo.
              </p>
              <div className="flex gap-4">
                <div className="flex -space-x-3">
                  {['A', 'B', 'C', 'D', 'E'].map((letter, i) => (
                    <div
                      key={letter}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-discord-bg"
                      style={{ zIndex: 5 - i }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Junte-se a 500K+ usuários</div>
                  <div className="text-xs text-discord-text-dim">Ativos e crescendo</div>
                </div>
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

export default RegisterPage
