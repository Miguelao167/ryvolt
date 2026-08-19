import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SignalingProvider } from '@/components/providers/SignalingProvider'
import { AuthHydrator } from '@/components/providers/AuthHydrator'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RYVOLT - Where Communities Thrive',
  description: 'Chat, call, share and build communities without limits. A modern platform for real-time communication.',
  keywords: ['community', 'chat', 'video call', 'voice chat', 'screen sharing', 'Discord alternative'],
  authors: [{ name: 'RYVOLT Team' }],
  creator: 'RYVOLT',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/ryvolt-logo.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/ryvolt-logo.png',
    shortcut: '/ryvolt-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ryvolt.com',
    siteName: 'RYVOLT',
    title: 'RYVOLT - Where Communities Thrive',
    description: 'Chat, call, share and build communities without limits.',
    images: [{ url: '/ryvolt-logo.png', width: 1200, height: 1200, alt: 'RYVOLT' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RYVOLT - Where Communities Thrive',
    description: 'Chat, call, share and build communities without limits.',
    creator: '@ryvolt',
    images: ['/ryvolt-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0F' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider>
          <SignalingProvider>
            <AuthHydrator />
            {children}
          </SignalingProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: '!bg-discord-surface !text-white !border !border-discord-deep',
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
