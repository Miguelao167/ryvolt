'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

/**
 * Runs on app mount: restores the Supabase session and fetches the
 * matching public.users row into the auth store. Without this, the
 * store only knows about users after they explicitly log in.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return null
}
