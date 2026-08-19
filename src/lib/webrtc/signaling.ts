// =============================================
// RYVOLT - WebRTC signaling layer
// =============================================
// Abstração do transporte de signaling. Suporta duas implementações:
//
//   - LoopbackSignaling  → memória local (dev/teste entre duas abas da mesma origem)
//   - SupabaseSignaling  → Supabase Realtime Broadcast (produção, entre peers remotos)
//
// O SignalingProvider escolhe qual usar baseado em env.

import type { SignalEnvelope, SignalMessage } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type SignalHandler = (env: SignalEnvelope) => void

export interface SignalingAdapter {
  connect(userId: string): Promise<void>
  disconnect(): void
  join(room: string): Promise<void>
  leave(room: string): Promise<void>
  send(room: string, msg: SignalMessage): Promise<void>
  onMessage(handler: SignalHandler): () => void
  setUserId(userId: string): void
}

/**
 * Implementação in-memory. Suporta múltiplas instâncias dentro da
 * mesma página (cada userId vira um peer separado). Útil pra teste
 * local do WebRTC sem servidor.
 */
export class LoopbackSignaling implements SignalingAdapter {
  private handlers = new Set<SignalHandler>()
  private rooms = new Set<string>()
  private userId: string | null = null
  private static bus = new Set<LoopbackSignaling>()

  async connect(userId: string): Promise<void> {
    this.userId = userId
    LoopbackSignaling.bus.add(this)
  }

  disconnect(): void {
    LoopbackSignaling.bus.delete(this)
    this.rooms.clear()
    this.userId = null
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  async join(room: string): Promise<void> {
    this.rooms.add(room)
  }

  async leave(room: string): Promise<void> {
    this.rooms.delete(room)
  }

  async send(room: string, msg: SignalMessage): Promise<void> {
    const env: SignalEnvelope = { room, msg }
    const bus = LoopbackSignaling.bus
    for (const peer of Array.from(bus)) {
      if (peer === this) continue
      if (!peer.rooms.has(room)) continue
      queueMicrotask(() => {
        peer.handlers.forEach((h: SignalHandler) => h(env))
      })
    }
  }

  onMessage(handler: SignalHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }
}

/**
 * Implementação real usando Supabase Realtime Broadcast.
 *
 * Um canal por sala (`voice:<channelId>`). Mensagens são publicadas
 * via `channel.send({ type: 'broadcast', event: 'signal', payload })`
 * e recebidas no `channel.on('broadcast', { event: 'signal' }, ...)`.
 *
 * O Supabase cuida do fan-out entre todos os peers inscritos no canal,
 * então não importa de onde cada um está conectado.
 *
 * Requisitos:
 *   - Projeto Supabase ativo
 *   - Realtime habilitado (padrão no plano free)
 *   - Broadcast não precisa de RLS — canal é efêmero, sem persistência
 */
export class SupabaseSignaling implements SignalingAdapter {
  private supabase: SupabaseClient
  private channels = new Map<string, ReturnType<SupabaseClient['channel']>>()
  private handlers = new Set<SignalHandler>()
  private userId: string | null = null

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  async connect(userId: string): Promise<void> {
    this.userId = userId
  }

  disconnect(): void {
    for (const ch of Array.from(this.channels.values())) {
      void ch.unsubscribe()
    }
    this.channels.clear()
    this.userId = null
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  async join(room: string): Promise<void> {
    if (this.channels.has(room)) return
    const channel = this.supabase.channel(`voice:${room}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: this.userId ?? '' },
      },
    })

    channel.on('broadcast', { event: 'signal' }, (payload: { payload: SignalEnvelope }) => {
      const env = payload.payload
      // Defensive: ignore echoes and cross-room leaks
      if (!env || env.room !== room) return
      this.handlers.forEach((h) => h(env))
    })

    const status = await new Promise<'ok' | 'err' | 'timeout'>((resolve) => {
      let resolved = false
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true
          resolve('timeout')
        }
      }, 5000)
      channel.subscribe((status) => {
        if (resolved) return
        if (status === 'SUBSCRIBED') {
          resolved = true
          clearTimeout(timer)
          resolve('ok')
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          resolved = true
          clearTimeout(timer)
          resolve('err')
        }
      })
    })

    if (status !== 'ok') {
      console.warn(`[SupabaseSignaling] join(${room}) failed:`, status)
      return
    }
    this.channels.set(room, channel)
  }

  async leave(room: string): Promise<void> {
    const ch = this.channels.get(room)
    if (!ch) return
    await ch.unsubscribe()
    this.channels.delete(room)
  }

  async send(room: string, msg: SignalMessage): Promise<void> {
    const ch = this.channels.get(room)
    if (!ch) {
      // Auto-join if not yet (defensive — shouldn't happen in normal flow)
      console.warn(`[SupabaseSignaling] send to unjoined room ${room}`)
      return
    }
    const envelope: SignalEnvelope = { room, msg }
    await ch.send({
      type: 'broadcast',
      event: 'signal',
      payload: envelope,
    })
  }

  onMessage(handler: SignalHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }
}

/** Singleton holder — setado em bootstrap */
let currentAdapter: SignalingAdapter | null = null

export function setSignalingAdapter(adapter: SignalingAdapter) {
  currentAdapter = adapter
}

export function getSignalingAdapter(): SignalingAdapter {
  if (!currentAdapter) {
    // Fallback to loopback so tests don't crash before the provider mounts
    currentAdapter = new LoopbackSignaling()
  }
  return currentAdapter
}
