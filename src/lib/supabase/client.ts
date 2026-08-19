import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Garante que o cookie de sessão seja lido/escrito corretamente no browser
        getAll() {
          if (typeof document === 'undefined') return []
          return document.cookie
            .split(';')
            .map((c) => {
              const [name, ...rest] = c.trim().split('=')
              return { name, value: decodeURIComponent(rest.join('=')) }
            })
            .filter((c) => c.name)
        },
        setAll(cookies) {
          if (typeof document === 'undefined') return
          for (const { name, value, options } of cookies) {
            let cookie = `${name}=${encodeURIComponent(value)}`
            if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`
            if (options?.path) cookie += `; Path=${options.path}`
            else cookie += '; Path=/'
            if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
            else cookie += '; SameSite=Lax'
            if (options?.secure) cookie += '; Secure'
            document.cookie = cookie
          }
        },
      },
    }
  )
}
