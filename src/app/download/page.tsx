'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Download, Apple, Monitor, Smartphone, Terminal, Globe, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Platform {
  id: string
  name: string
  os: string
  size: string
  version: string
  arch: string
  icon: React.ComponentType<{ className?: string }>
  note?: string
  downloadUrl: string
  primary?: boolean
}

const PLATFORMS: Platform[] = [
  {
    id: 'windows',
    name: 'Windows',
    os: 'Windows 10+',
    size: '118 MB',
    version: 'v0.1.0',
    arch: 'x64',
    icon: Monitor,
    downloadUrl: '/downloads/ryvolt-setup-0.1.0.exe',
    primary: true,
  },
  {
    id: 'macos',
    name: 'macOS',
    os: 'macOS 12+',
    size: '124 MB',
    version: 'v0.1.0',
    arch: 'Apple Silicon / Intel',
    icon: Apple,
    downloadUrl: '/downloads/ryvolt-0.1.0.dmg',
  },
  {
    id: 'linux',
    name: 'Linux',
    os: 'Ubuntu, Fedora, Arch',
    size: '106 MB',
    version: 'v0.1.0',
    arch: 'x64',
    icon: Terminal,
    downloadUrl: '/downloads/ryvolt_0.1.0_amd64.deb',
  },
]

const MOBILE_PLATFORMS: Platform[] = [
  {
    id: 'ios',
    name: 'iOS',
    os: 'iOS 15+',
    size: '52 MB',
    version: 'v0.1.0',
    arch: 'iPhone / iPad',
    icon: Smartphone,
    downloadUrl: 'https://apps.apple.com',
    note: 'Em breve na App Store',
  },
  {
    id: 'android',
    name: 'Android',
    os: 'Android 9+',
    size: '48 MB',
    version: 'v0.1.0',
    arch: 'arm64',
    icon: Smartphone,
    downloadUrl: 'https://play.google.com',
    note: 'Em breve na Play Store',
  },
]

const FEATURES = [
  'Mensagens em tempo real com baixa latência',
  'Chamadas de voz e vídeo em HD',
  'Compartilhamento de tela nativo',
  'Servidores, canais e comunidades ilimitadas',
  'Sincronização entre desktop e mobile',
  'Criptografia ponta a ponta em desenvolvimento',
]

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-discord-bg overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-discord-blurple/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-discord-green/20 rounded-full blur-[128px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-discord-deep bg-discord-bg/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" withWordmark />
          </Link>
          <Link href="/" className="text-sm text-discord-text-muted hover:text-white transition-colors">
            ← Voltar
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-discord-surface border border-discord-deep text-sm text-discord-text-muted mb-6">
              <Sparkles className="w-4 h-4 text-discord-blurple" />
              Beta aberto • Grátis pra sempre
            </span>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="text-white">Baixe o </span>
              <span className="text-gradient">RYVOLT</span>
            </h1>
            <p className="text-xl text-discord-text-muted max-w-2xl mx-auto">
              Leve suas comunidades pra qualquer tela. Desktop completo, com tudo sempre em sincronia.
            </p>
          </motion.div>

          {/* Desktop */}
          <section className="mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-discord-text-dim mb-4">
              Desktop
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATFORMS.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={`relative rounded-2xl border bg-discord-surface p-6 transition-colors hover:border-discord-blurple/50 ${
                    p.primary
                      ? 'border-discord-blurple/40 shadow-lg shadow-discord-blurple/10'
                      : 'border-discord-deep'
                  }`}
                >
                  {p.primary && (
                    <span className="absolute -top-2.5 left-6 px-2 py-0.5 rounded-full bg-discord-blurple text-white text-[10px] font-semibold uppercase tracking-wider">
                      Recomendado
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-discord-bg border border-discord-deep flex items-center justify-center">
                      <p.icon className="w-6 h-6 text-discord-blurple" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {p.name}
                      </h3>
                      <p className="text-xs text-discord-text-dim">{p.os}</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-5 text-sm text-discord-text-muted">
                    <li className="flex items-center justify-between">
                      <span className="text-discord-text-dim">Versão</span>
                      <span className="tabular-nums">{p.version}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-discord-text-dim">Arquitetura</span>
                      <span className="tabular-nums">{p.arch}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-discord-text-dim">Tamanho</span>
                      <span className="tabular-nums">{p.size}</span>
                    </li>
                  </ul>

                  <a href={p.downloadUrl} download>
                    <Button
                      className="w-full"
                      variant={p.primary ? 'primary' : 'secondary'}
                    >
                      <Download className="w-4 h-4" />
                      Baixar pra {p.name}
                    </Button>
                  </a>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Mobile */}
          <section className="mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-discord-text-dim mb-4">
              Mobile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOBILE_PLATFORMS.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className="rounded-2xl border border-discord-deep bg-discord-surface p-6 opacity-80"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-discord-bg border border-discord-deep flex items-center justify-center">
                      <p.icon className="w-6 h-6 text-discord-text-dim" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {p.name}
                      </h3>
                      <p className="text-xs text-discord-text-dim">{p.os}</p>
                    </div>
                  </div>

                  <p className="text-sm text-discord-text-dim mb-4">{p.note}</p>

                  <Button disabled className="w-full" variant="secondary">
                    <Smartphone className="w-4 h-4" />
                    Em breve
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Web + features */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="rounded-2xl border border-discord-deep bg-discord-surface p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-discord-bg border border-discord-deep flex items-center justify-center">
                  <Globe className="w-6 h-6 text-discord-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Web</h3>
                  <p className="text-xs text-discord-text-dim">Sem instalação</p>
                </div>
              </div>
              <p className="text-sm text-discord-text-muted mb-4">
                Acesse direto pelo navegador. Sem download, sem espera.
              </p>
              <Link href="/app">
                <Button variant="secondary" className="w-full">
                  <Globe className="w-4 h-4" />
                  Abrir no navegador
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="rounded-2xl border border-discord-deep bg-discord-surface p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                O que vem no app
              </h3>
              <ul className="space-y-2 text-sm text-discord-text-muted">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-discord-green mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </section>

          {/* Sistema requirements */}
          <section className="mt-16 text-center">
            <p className="text-sm text-discord-text-dim">
              Problemas na instalação?{' '}
              <Link href="/contact" className="text-discord-blurple hover:underline">
                Fale com a gente
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
