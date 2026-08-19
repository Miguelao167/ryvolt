'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MessageCircle, Users, Video, Monitor, Shield, Zap, Globe, ChevronRight, ArrowRight } from 'lucide-react'

// Spring physics configuration
const springTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: springTransition
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// ============================================
// NAVIGATION
// ============================================
export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-discord-darker/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">RYVOLT</span>
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
            Recursos
          </a>
          <a href="#capabilities" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
            Capacidades
          </a>
          <a href="/download" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
            Download
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a href="/login" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors duration-200">
            Entrar
          </a>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg bg-discord-blurple hover:bg-discord-blurple-hover text-white text-sm font-medium transition-colors duration-200"
          >
            Começar
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ============================================
// HERO SECTION
// ============================================
export function HeroSection() {
  return (
    <section className="relative min-h-dvh flex items-center overflow-hidden pt-16">
      {/* Background Effects - Subtle, no harsh borders */}
      <div className="absolute inset-0">
        {/* Very subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-discord-blurple/5 rounded-full blur-[150px]" />
        {/* Ultra subtle grid - barely visible */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-discord-bg text-sm text-gray-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-discord-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-discord-green" />
                </span>
                Beta aberto
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeInUp} className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="text-white">Sua comunidade.</span>
                <br />
                <span className="text-discord-blurple">Suas conexões.</span>
                <br />
                <span className="text-white">Seu espaço.</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                A plataforma moderna para comunidades que vão além do chat. Voz, vídeo e comunidade — tudo em um lugar.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-discord-blurple hover:bg-discord-blurple-hover text-white font-medium transition-colors duration-200"
              >
                Criar comunidade
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-discord-bg hover:bg-discord-surface2 text-white font-medium transition-colors duration-200"
              >
                Ver demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Visual - App Preview - Discord Style */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, ...springTransition }}
            className="relative"
          >
            {/* App Mockup - Discord-inspired */}
            <div className="relative rounded-xl bg-discord-deep overflow-hidden shadow-2xl shadow-black/40">
              {/* Server Sidebar */}
              <div className="flex">
                {/* Server List */}
                <div className="w-[70px] bg-discord-deep border-r border-black/20 flex flex-col items-center py-3 gap-2">
                  {/* Home Button */}
                  <div className="w-12 h-12 rounded-2xl bg-discord-blurple flex items-center justify-center hover:rounded-xl transition-all duration-200 cursor-pointer group">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  {/* Separator */}
                  <div className="w-8 h-0.5 bg-discord-bg rounded-full my-1" />

                  {/* Server icons */}
                  {['R', 'G', 'D', 'M'].map((letter, i) => (
                    <div
                      key={letter}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-sm cursor-pointer transition-all duration-200 ${
                        i === 0
                          ? 'bg-discord-blurple text-white'
                          : 'bg-discord-bg text-gray-400 hover:bg-discord-blurple hover:rounded-xl'
                      }`}
                    >
                      {letter}
                    </div>
                  ))}

                  {/* Add server */}
                  <div className="w-10 h-10 rounded-2xl bg-discord-green/20 flex items-center justify-center text-discord-green hover:bg-discord-green hover:text-discord-deep cursor-pointer transition-all duration-200">
                    +
                  </div>
                </div>

                {/* Channel Sidebar */}
                <div className="w-60 bg-discord-surface flex flex-col">
                  {/* Server name */}
                  <div className="px-4 py-4 border-b border-black/20">
                    <div className="text-sm font-semibold text-white">RYVOLT Server</div>
                  </div>

                  {/* Channels */}
                  <div className="flex-1 overflow-y-auto py-4 px-2">
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Canais de Texto</div>
                      {['geral', 'aleatório', 'jogos', 'música', 'suporte'].map((channel, i) => (
                        <div
                          key={channel}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors duration-150 ${
                            i === 0
                              ? 'bg-discord-hover text-white'
                              : 'text-gray-400 hover:bg-discord-surface-2 hover:text-gray-200'
                          }`}
                        >
                          <span className="text-lg opacity-60">#</span>
                          {channel}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User panel */}
                  <div className="h-14 bg-discord-deep border-t border-black/20 flex items-center px-3 gap-2">
                    <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-xs font-semibold">
                      M
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white">Marina</div>
                      <div className="text-xs text-gray-500">Online</div>
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-discord-bg flex flex-col">
                  {/* Chat Header */}
                  <div className="px-4 py-4 border-b border-black/20">
                    <div className="text-sm font-semibold text-white"># geral</div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {[
                      { name: 'Marina', avatar: 'M', color: '#5865F2', msg: 'Nova atualização liberada! 🚀', time: '2 min' },
                      { name: 'Lucas', avatar: 'L', color: '#57F287', msg: 'Visual incrível, parabéns!', time: '1 min' },
                      { name: 'Ana', avatar: 'A', color: '#FEE75C', msg: 'Time mandando demais 🔥', time: 'agora' },
                    ].map((msg, i) => (
                      <div key={i} className="flex gap-4 hover:bg-discord-surface/50 p-2 rounded-md -mx-2">
                        <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-semibold shrink-0">
                          {msg.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-white text-sm">{msg.name}</span>
                            <span className="text-xs text-gray-500">{msg.time}</span>
                          </div>
                          <p className="text-sm text-gray-300">{msg.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-discord-surface2 border border-black/20">
                      <span className="text-gray-500 text-sm">Mensagem em #geral</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-6 top-20 hidden lg:block"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-discord-deep shadow-xl">
                <div className="w-6 h-6 rounded-full bg-discord-green flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-sm text-gray-300">24 online</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-6 bottom-24 hidden lg:block"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-discord-deep shadow-xl">
                <Video className="w-4 h-4 text-discord-blurple" />
                <span className="text-sm text-gray-300">3 em chamada</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// FEATURES SECTION
// ============================================
const features = [
  {
    icon: MessageCircle,
    title: 'Mensagens em Tempo Real',
    description: 'Comunicação instantânea com mídia, reações e threads organizados.',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    icon: Users,
    title: 'Comunidades',
    description: 'Crie e organize com canais, categorias e cargos personalizados.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Video,
    title: 'Chamadas em HD',
    description: 'Videochamadas cristalinas com compartilhamento de tela.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Monitor,
    title: 'Compartilhar Tela',
    description: 'Compartilhe sua tela, janela ou aba com qualidade adaptável.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Segurança',
    description: 'Criptografia de ponta e ferramentas avançadas de moderação.',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: Zap,
    title: 'Ultra Rápido',
    description: 'Atualizações em tempo real com latência mínima.',
    color: 'from-yellow-500 to-amber-500',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="inline-block text-sm font-medium text-discord-blurple uppercase tracking-widest mb-4"
          >
            Recursos
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4"
          >
            Tudo que você precisa
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Ferramentas poderosas para comunidades modernas. Sem complicações.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="group p-6 rounded-xl bg-discord-surface hover:bg-discord-surface-2 transition-colors duration-200"
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-5`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// STATS SECTION
// ============================================
const stats = [
  { value: '10M+', label: 'Mensagens/dia' },
  { value: '500K+', label: 'Usuários' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Latência' },
]

export function StatsSection() {
  return (
    <section className="relative py-20 bg-discord-surface/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ...springTransition }}
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// CAPABILITIES SECTION
// ============================================
const capabilities = [
  {
    badge: 'Voz',
    title: 'Áudio Cristalino',
    description: 'Comunicação por voz de alta qualidade com cancelamento de ruído e baixa latência.',
    features: ['Cancelamento de ruído', 'Controle automático', 'Baixa latência'],
    reversed: false,
  },
  {
    badge: 'Vídeo',
    title: 'Cara a Cara',
    description: 'Chamadas de vídeo em HD com até 25 participantes e compartilhamento de tela.',
    features: ['Até 25 participantes', 'Compartilhar tela', 'Picture-in-picture'],
    reversed: true,
  },
  {
    badge: 'Tela',
    title: 'Compartilhe Tudo',
    description: 'Compartilhe sua tela inteira ou apenas uma janela específica.',
    features: ['720p a 1080p', '15-60 FPS', 'Bitrate adaptativo'],
    reversed: false,
  },
]

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="relative py-32">
      <div className="max-w-6xl mx-auto px-6 space-y-24 lg:space-y-32">
        {capabilities.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ...springTransition }}
            className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
              section.reversed ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Content */}
            <div className={`space-y-6 ${section.reversed ? 'lg:order-2' : ''}`}>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-discord-blurple/20 text-discord-blurple text-sm font-medium">
                {section.badge}
              </span>
              <h3 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                {section.title}
              </h3>
              <p className="text-lg text-gray-400 leading-relaxed">
                {section.description}
              </p>
              <ul className="space-y-3">
                {section.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-discord-green/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-discord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual */}
            <div className={`relative ${section.reversed ? 'lg:order-1' : ''}`}>
              <div className="aspect-video rounded-xl bg-discord-surface overflow-hidden">
                {/* Abstract representation - Discord style */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-discord-blurple to-discord-blurple-hover flex items-center justify-center shadow-lg shadow-discord-blurple/30">
                      <Globe className="w-10 h-10 text-white" />
                    </div>
                    {/* Orbiting elements - subtle */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-8 border border-discord-blurple/20 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-16 border border-white/5 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ============================================
// CTA SECTION
// ============================================
export function CTASection() {
  return (
    <section className="relative py-32">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="relative text-center"
        >
          {/* Subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-discord-blurple/10 via-transparent to-transparent rounded-3xl blur-3xl" />

          <div className="relative p-12 lg:p-16 rounded-2xl bg-discord-surface">
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
              Junte-se a milhares de comunidades que já estão crescendo na plataforma.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-discord-blurple hover:bg-discord-blurple-hover text-white font-medium text-lg transition-colors duration-200"
              >
                Criar comunidade
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-discord-bg hover:bg-discord-surface2 text-white font-medium text-lg transition-colors duration-200"
              >
                Explorar
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// FOOTER
// ============================================
export function Footer() {
  return (
    <footer className="bg-discord-deep py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">RYVOLT</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>© 2024 RYVOLT</span>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-gray-300 transition-colors duration-200">
                Privacidade
              </a>
              <a href="/terms" className="hover:text-gray-300 transition-colors duration-200">
                Termos
              </a>
              <a href="/contact" className="hover:text-gray-300 transition-colors duration-200">
                Contato
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
