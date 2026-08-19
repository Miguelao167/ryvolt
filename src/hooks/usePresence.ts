'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

/**
 * Sincroniza o status do user logado com a presença real:
 * - ao montar: chama markOnline()
 * - quando a aba volta a ficar ativa: chama markOnline()
 * - quando a aba fica oculta por > 5 min: chama markOffline()
 * - quando a página vai descarregar: chama markOffline() (best-effort)
 *
 * Coloca em <AppShell> ou no layout raiz pra cobrir todo o app.
 */
export function usePresence() {
  const markOnline = useAuthStore((s) => s.markOnline)
  const markOffline = useAuthStore((s) => s.markOffline)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hiddenSinceRef = useRef<number | null>(null)
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    // Garante online ao montar
    void markOnline()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenSinceRef.current = Date.now()
        // Espera 5 min na aba oculta pra considerar offline
        if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
        offlineTimerRef.current = setTimeout(() => {
          void markOffline()
        }, 5 * 60 * 1000)
      } else {
        // Voltou a ficar visível
        hiddenSinceRef.current = null
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current)
          offlineTimerRef.current = null
        }
        void markOnline()
      }
    }

    const onBeforeUnload = () => {
      // sendBeacon seria melhor pra garantir envio no unload, mas
      // markOffline usa fetch normal — ainda assim suficiente em muitos casos.
      void markOffline()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)
    // Algumas páginas (mobile/PWA) disparam pagehide em vez de beforeunload
    window.addEventListener('pagehide', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onBeforeUnload)
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current)
        offlineTimerRef.current = null
      }
    }
  }, [isAuthenticated, markOnline, markOffline])
}