import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  updateStatus: (status: UserStatus) => void
  markOnline: () => Promise<void>
  markOffline: () => Promise<void>
  updateProfile: (updates: Partial<User>) => void

  // Supabase actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hydrate: () => Promise<void>
}

// Maps a public.users row → the app's User type (snake_case → camelCase)
function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bannerUrl: row.banner_url,
    bio: row.bio,
    status: row.status ?? 'offline',
    customStatus: row.custom_status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateStatus: (status) => {
        const state = get()
        if (!state.user) return
        set({ user: { ...state.user, status } })
        // Fire-and-forget DB write (best effort)
        const supabase = createClient()
        void supabase.from('users').update({ status }).eq('id', state.user.id)
      },

      /**
       * Marca o user como online e persiste no DB. Chamado em:
       * - signIn bem-sucedido
       * - hydrate quando há sessão
       * - visibilitychange quando volta pra aba ativa
       * Idempotente — não causa write se já tá online.
       */
      markOnline: async () => {
        const state = get()
        if (!state.user) return
        if (state.user.status === 'online') return
        set({ user: { ...state.user, status: 'online' } })
        const supabase = createClient()
        await supabase
          .from('users')
          .update({ status: 'online' })
          .eq('id', state.user.id)
      },

      /**
       * Marca o user como offline. Chamado em:
       * - signOut
       * - beforeunload
       * - visibilitychange quando aba fica oculta por >5min
       */
      markOffline: async () => {
        const state = get()
        if (!state.user) return
        if (state.user.status === 'offline') return
        set({ user: { ...state.user, status: 'offline' } })
        const supabase = createClient()
        await supabase
          .from('users')
          .update({ status: 'offline' })
          .eq('id', state.user.id)
      },

      updateProfile: (updates) => {
        const state = get()
        if (!state.user) return
        set({
          user: { ...state.user, ...updates, updatedAt: new Date() },
        })
      },

      signIn: async (email, password) => {
        set({ isLoading: true })
        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error || !data.user) {
          set({ isLoading: false })
          return { error: error?.message ?? 'Falha no login' }
        }
        // Fetch the public.users profile
        const { data: profile, error: profileErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
        if (profileErr || !profile) {
          set({ isLoading: false })
          return { error: profileErr?.message ?? 'Perfil não encontrado' }
        }
        // Auto-online: toda vez que faz login, o user fica disponível
        await supabase.from('users').update({ status: 'online' }).eq('id', profile.id)
        set({
          user: { ...rowToUser(profile), status: 'online' },
          isAuthenticated: true,
          isLoading: false,
        })
        return { error: null }
      },

      signUp: async (email, password, username, displayName) => {
        set({ isLoading: true })
        const supabase = createClient()
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: displayName },
          },
        })
        if (error || !data.user) {
          set({ isLoading: false })
          return { error: error?.message ?? 'Falha no cadastro' }
        }
        // If email confirmation is OFF, we get a session immediately.
        // If it's ON, session will be null and the user must confirm.
        if (!data.session) {
          set({ isLoading: false })
          return { error: 'Conta criada! Verifique seu email para confirmar.' }
        }
        // The handle_new_user trigger should have created the public.users row.
        // Wait briefly for it and then fetch.
        let profile: any = null
        for (let i = 0; i < 5; i++) {
          const { data: p } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()
          if (p) {
            profile = p
            break
          }
          await new Promise((r) => setTimeout(r, 200))
        }
        if (!profile) {
          set({ isLoading: false })
          return { error: 'Conta criada, mas perfil ainda não propagou. Faça login.' }
        }
        set({
          user: rowToUser(profile),
          isAuthenticated: true,
          isLoading: false,
        })
        return { error: null }
      },

      signOut: async () => {
        const supabase = createClient()
        const state = get()
        // Marca offline antes de deslogar
        if (state.user) {
          await supabase.from('users').update({ status: 'offline' }).eq('id', state.user.id)
        }
        await supabase.auth.signOut()
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      // Called on app mount to restore session from Supabase cookies
      hydrate: async () => {
        set({ isLoading: true })
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        const session = data.session
        if (!session?.user) {
          set({ user: null, isAuthenticated: false, isLoading: false })
          return
        }
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          // Auto-online: ao entrar/sessão restaurada, marca disponível
          await supabase.from('users').update({ status: 'online' }).eq('id', profile.id)
          set({
            user: { ...rowToUser(profile), status: 'online' },
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'ryvolt-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
