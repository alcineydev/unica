import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  title: {
    default: 'UNICA - Clube de Benefícios',
    template: '%s | UNICA',
  },
  description: 'Seu clube de benefícios e descontos exclusivos',
  keywords: ['clube de benefícios', 'descontos', 'cashback', 'Sinop', 'Mato Grosso'],
  manifest: '/api/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'UNICA',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ServiceWorkerRegister />
          {children}
          <InstallPrompt />
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
