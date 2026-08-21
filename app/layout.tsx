import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AiopsCopilot } from '@/components/aiops-copilot'
import { DemoStoryMode } from '@/components/demo-story-mode'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: '智能告警收敛与根因分析中心 | Incident Command Center',
  description:
    '数据中心 AIOps 告警收敛平台 — 将海量告警自动收敛为可执行事件并完成根因定位（RCA）。',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#3dcd58',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" className={`bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <AiopsCopilot />
        <DemoStoryMode />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
