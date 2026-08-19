'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  getSignalingAdapter,
  setSignalingAdapter,
  LoopbackSignaling,
  SupabaseSignaling,
} from '@/lib/webrtc'
import { createClient } from '@/lib/supabase/client'

/**
 * Mounts the signaling adapter on the client.
 *
 * - If NEXT_PUBLIC_SUPABASE_URL is configured AND the user is authenticated,
 *   uses Supabase Realtime Broadcast (real cross-peer signaling).
 * - Otherwise falls back to LoopbackSignaling (in-memory, for local dev).
 *
 * The adapter is swapped on user change so the signaling userId stays
 * in sync with the auth store.
 */
export function SignalingProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id)
  const adapterRef = useRef<ReturnType<typeof getSignalingAdapter> | null>(null)

  useEffect(() => {
    const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL

    let adapter: ReturnType<typeof getSignalingAdapter>
    if (supabaseConfigured) {
      adapter = new SupabaseSignaling(createClient())
    } else {
      adapter = new LoopbackSignaling()
    }

    setSignalingAdapter(adapter)
    adapterRef.current = adapter

    if (userId) {
      void adapter.connect(userId).catch((err) => {
        console.error('[SignalingProvider] connect failed:', err)
      })
    }

    return () => {
      adapter.disconnect()
    }
  }, [userId])

  return <>{children}</>
}
