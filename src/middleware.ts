import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Paths that require authentication
const protectedPaths = ['/app', '/settings', '/friends', '/dms']

// Paths that should redirect to /app if already authenticated
const authPaths = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = nextUrlSafe(request)

  let response = NextResponse.next({ request })

  // Create a Supabase client that reads/writes cookies through the middleware
  // so the auth state stays in sync between the edge and the browser.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // getUser() re-validates the JWT — that's what we want in middleware,
  // not just getSession() (which is unverified).
  const { data } = await supabase.auth.getUser()
  const isAuthenticated = !!data.user

  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  if (!isAuthenticated && isProtectedPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

function nextUrlSafe(request: NextRequest) {
  return { pathname: request.nextUrl.pathname }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
