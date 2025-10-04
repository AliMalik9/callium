import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Anonymous Voice Call',
  description: 'Secure, anonymous voice calling with WebRTC technology',
  keywords: ['voice call', 'anonymous', 'webrtc', 'secure', 'privacy'],
  authors: [{ name: 'Anonymous Voice Call' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Anonymous Voice Call',
    description: 'Secure, anonymous voice calling with WebRTC technology',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          {children}
        </div>
      </body>
    </html>
  )
}

