'use client'

import { useState } from 'react'
import { Heart, Sparkles, Zap, Smile, Image as ImageIcon, BadgeCheck, Mic, Video, Server, Crown, Gift, Upload, Palette, Wand2, HeartHandshake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface NitroPageProps {
  onBack: () => void
}

type NitroTab = 'home' | 'news' | 'best' | 'plans' | 'compare'

const TABS: { id: NitroTab; label: string }[] = [
  { id: 'home', label: 'Início' },
  { id: 'news', label: 'Novidades' },
  { id: 'best', label: 'Melhor do Nitro' },
  { id: 'plans', label: 'Planos' },
  { id: 'compare', label: 'Comparar' },
]

export function NitroPage({ onBack }: NitroPageProps) {
  const [tab, setTab] = useState<NitroTab>('plans')

  return (
    <div className="flex-1 flex flex-col bg-discord-bg overflow-y-auto">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-discord-bg/85 backdrop-blur border-b border-discord-deep">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-sm text-discord-text-dim hover:text-white transition-colors"
            >
              ← Voltar
            </button>
            <nav className="flex items-center gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative px-3 py-1.5 text-sm rounded-md transition-colors',
                    tab === t.id
                      ? 'text-white font-semibold'
                      : 'text-discord-text-muted hover:text-white'
                  )}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute left-2 right-2 -bottom-[14px] h-[2px] bg-discord-text rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded text-discord-text-dim hover:text-white hover:bg-discord-hover transition-colors"
              title="Favoritar"
            >
              <Heart className="w-4 h-4" />
            </button>
            <Button>
              <Gift className="w-4 h-4 mr-1.5" />
              Presentear Nitro
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      {tab === 'home' && <NitroHome onPickPlan={() => setTab('plans')} />}
      {tab === 'news' && <NitroNews />}
      {tab === 'best' && <NitroBest />}
      {tab === 'plans' && <NitroPlans />}
      {tab === 'compare' && <NitroCompare />}
    </div>
  )
}

// ============== HOME ==============

function NitroHome({ onPickPlan }: { onPickPlan: () => void }) {
  return (
    <div className="flex-1 px-6 py-16 max-w-5xl mx-auto w-full text-center">
      <Sparkles className="w-12 h-12 mx-auto text-fuchsia-400 mb-4" />
      <h1 className="text-5xl font-black italic text-white">NITRO</h1>
      <p className="mt-4 text-lg text-discord-text-muted max-w-xl mx-auto">
        Mais emojis, uploads maiores, vídeo em HD e vantagens exclusivas pra você e seus servidores.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button onClick={onPickPlan}>Escolher plano</Button>
        <Button variant="secondary" onClick={() => alert('Em breve!')}>
          Presentear
        </Button>
      </div>
    </div>
  )
}

// ============== NEWS ==============

function NitroNews() {
  const news = [
    {
      title: 'Uploads agora vão até 500MB',
      body: 'Compartilhe vídeos e arquivos pesados sem dor de cabeça com o Nitro.',
      icon: Upload,
    },
    {
      title: 'Emoji personalizado em qualquer servidor',
      body: 'Use seus emojis em conversas de qualquer servidor.',
      icon: Smile,
    },
    {
      title: 'Transmissão de vídeo em HD',
      body: 'Calls mais nítidas e suporte a 1080p / 60fps.',
      icon: Video,
    },
  ]
  return (
    <div className="px-6 py-10 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-black text-white mb-6">Novidades</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {news.map((n) => {
          const Icon = n.icon
          return (
            <div
              key={n.title}
              className="rounded-xl border border-discord-deep bg-discord-surface p-5"
            >
              <Icon className="w-6 h-6 text-fuchsia-400 mb-2" />
              <div className="font-semibold text-white">{n.title}</div>
              <div className="text-sm text-discord-text-dim mt-1">{n.body}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============== BEST OF NITRO ==============

function NitroBest() {
  const items = [
    { icon: Smile, title: 'Emojis personalizados', desc: 'Use em qualquer servidor.' },
    { icon: Upload, title: 'Uploads maiores', desc: 'Até 500MB por arquivo.' },
    { icon: Video, title: 'Vídeo em HD', desc: 'Calls mais nítidas em 1080p / 60fps.' },
    { icon: Server, title: 'Impulso de servidor', desc: '2 boosts inclusos.' },
    { icon: Crown, title: 'Perfil exclusivo', desc: 'Insígnia, banner e avatar animado.' },
    { icon: Palette, title: 'Temas e avatares', desc: 'Customize sua identidade visual.' },
  ]
  return (
    <div className="px-6 py-10 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-black text-white mb-6">O melhor do Nitro</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.title}
              className="flex items-start gap-4 rounded-xl border border-discord-deep bg-discord-surface p-4"
            >
              <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white">{it.title}</div>
                <div className="text-sm text-discord-text-dim">{it.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============== PLANS ==============

function NitroPlans() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 pt-16 pb-8 text-center">
        <h1 className="text-5xl sm:text-6xl font-black italic text-white tracking-tight">
          ESCOLHA SEU PLANO
        </h1>
        <p className="mt-3 text-discord-text-dim">
          Cancele quando quiser · Sem fidelidade
        </p>
      </section>

      {/* Plans */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Basic */}
          <PlanCard
            name="NITRO BÁSICO"
            monthly="8,90"
            yearly="89,90"
            benefits={[
              '50MB de upload',
              'Emoji personalizado em qualquer lugar',
              'Super-reações limitadas',
              'Insígnia Nitro especial no seu perfil',
            ]}
            highlight={false}
          />

          {/* Nitro */}
          <PlanCard
            name="NITRO"
            monthly="24,99"
            yearly="249,99"
            benefits={[
              'Tudo que está incluso no Básico, além de:',
              '500MB de upload',
              'Emoji personalizado em qualquer lugar',
              'Super-reações ilimitadas',
              'Transmissão de vídeo em HD',
              '2 impulsos de servidor',
              'Perfis personalizados e muito mais!',
            ]}
            highlight
            badge="EM ALTA"
          />
        </div>
      </section>

      {/* Compare */}
      <CompareSection />
    </>
  )
}

function PlanCard({
  name,
  monthly,
  yearly,
  benefits,
  highlight,
  badge,
}: {
  name: string
  monthly: string
  yearly: string
  benefits: string[]
  highlight?: boolean
  badge?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-6 border transition-all',
        highlight
          ? 'border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10 shadow-[0_0_60px_-15px] shadow-fuchsia-500/30'
          : 'border-discord-deep bg-discord-surface'
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-discord-text text-discord-bg">
          {badge}
        </div>
      )}

      <div className="text-2xl font-black italic text-white">{name}</div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-sm text-discord-text-dim">R$</span>
        <span className="text-4xl font-black text-white">{monthly}</span>
        <span className="text-sm text-discord-text-dim">/mês</span>
      </div>
      <div className="text-xs text-discord-text-dim">R$ {yearly}/ano</div>

      <div className="my-4 h-px bg-discord-deep" />

      <ul className="space-y-2">
        {benefits.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 text-sm text-discord-text-muted"
          >
            <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <Button className="w-full mt-6" variant={highlight ? 'primary' : 'secondary'}>
        Inscrever-se
      </Button>
    </div>
  )
}

// ============== COMPARE ==============

function NitroCompare() {
  return (
    <>
      <CompareSection standalone />
    </>
  )
}

const COMPARE_ROWS: {
  feature: string
  free: string | true | false
  basic: string | true | false
  nitro: string | true | false
  icon?: React.ReactNode
}[] = [
  { feature: 'Upload de arquivos', free: '10MB', basic: '50MB', nitro: '500MB', icon: <Upload className="w-4 h-4" /> },
  { feature: 'Emoji personalizado', free: false, basic: true, nitro: true, icon: <Smile className="w-4 h-4" /> },
  { feature: 'Super-reações', free: false, basic: 'Limitadas', nitro: 'Ilimitadas', icon: <Sparkles className="w-4 h-4" /> },
  { feature: 'Insígnia no perfil', free: false, basic: true, nitro: true, icon: <BadgeCheck className="w-4 h-4" /> },
  { feature: 'Banner de perfil', free: false, basic: true, nitro: true, icon: <ImageIcon className="w-4 h-4" /> },
  { feature: 'Vídeo em chamada', free: '720p', basic: '720p', nitro: '1080p / 60fps', icon: <Video className="w-4 h-4" /> },
  { feature: 'Áudio em chamada', free: 'Padrão', basic: 'Padrão', nitro: 'Crystal clear', icon: <Mic className="w-4 h-4" /> },
  { feature: 'Impulso de servidor', free: '—', basic: '—', nitro: '2 boosts', icon: <Zap className="w-4 h-4" /> },
  { feature: 'Tema personalizado', free: false, basic: '—', nitro: true, icon: <Palette className="w-4 h-4" /> },
  { feature: 'Avatar animado', free: false, basic: false, nitro: true, icon: <Wand2 className="w-4 h-4" /> },
]

function CompareSection({ standalone = false }: { standalone?: boolean }) {
  return (
    <section className={cn('px-6', standalone ? 'py-10' : 'pt-2 pb-16')}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-black italic text-center text-white">
          COMPARE NOSSOS PLANOS
        </h2>

        <div className="mt-8 rounded-2xl border border-discord-deep bg-discord-surface overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 px-5 py-3 bg-discord-bg border-b border-discord-deep text-xs font-bold uppercase tracking-wider text-discord-text-dim">
            <div>Recurso</div>
            <div className="text-center">Grátis</div>
            <div className="text-center">Básico</div>
            <div className="text-center text-fuchsia-400">Nitro</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-discord-deep">
            {COMPARE_ROWS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-4 px-5 py-3 text-sm items-center"
              >
                <div className="flex items-center gap-2 text-discord-text-muted">
                  {row.icon}
                  <span>{row.feature}</span>
                </div>
                <Cell value={row.free} />
                <Cell value={row.basic} />
                <Cell value={row.nitro} highlight />
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="grid grid-cols-4 px-5 py-4 bg-discord-bg border-t border-discord-deep">
            <div />
            <div />
            <div className="flex justify-center">
              <Button variant="secondary" size="sm">
                Escolher Básico
              </Button>
            </div>
            <div className="flex justify-center">
              <Button size="sm">Inscrever-se</Button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-discord-text-dim">
          💜 O Nitro apoia a RYVOLT e desbloqueia funções pra deixar a experiência mais sua.
        </p>
      </div>
    </section>
  )
}

function Cell({ value, highlight }: { value: string | true | false; highlight?: boolean }) {
  const txt = highlight
    ? 'text-white'
    : 'text-discord-text-muted'
  if (value === true) {
    return (
      <div className={cn('text-center', txt)}>
        <HeartHandshake className="w-4 h-4 mx-auto text-fuchsia-400" />
      </div>
    )
  }
  if (value === false) {
    return (
      <div className="text-center text-discord-text-dim">—</div>
    )
  }
  return <div className={cn('text-center font-medium', txt)}>{value}</div>
}