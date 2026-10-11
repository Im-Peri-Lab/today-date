import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from '@/components/ui/sonner'
import { NativeBootOverlay } from '@/components/boot/NativeBootOverlay'
import { Providers } from './providers'
import { cn } from '@/lib/utils'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Today Date',
  description: '우리 둘만의 데이트 기록',
  manifest: '/manifest.json',
  // iOS Safari가 이메일처럼 보이는 텍스트를 자동으로 밑줄+링크화하는 것을 막는다 —
  // 그 자동 밑줄이 줄바꿈 경계에서 끊겨 보이는 문제(계정/파트너 정보 화면의 이메일 표시)가 있었다.
  formatDetection: { email: false },
}

export const viewport: Viewport = {
  themeColor: '#6d28d9',
  width: 'device-width',
  initialScale: 1,
  // iPhone 노치 / 하단 바 영역까지 화면을 쓰되, CSS env(safe-area-inset-*) 로 여백을 제어한다.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={cn('font-sans', geistSans.variable)}>
      <body className={`${geistMono.variable} antialiased`}>
        {/* color = --s-active-line (#7c3aed). CSS 변수는 JS inline-style 주입 방식 특성상 직접 참조 불가 */}
        <NextTopLoader color="#7c3aed" height={2} showSpinner={false} />
        <NativeBootOverlay />
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          richColors
          offset={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
          mobileOffset={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        />
      </body>
    </html>
  )
}
