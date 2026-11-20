import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from '@/components/ui/sonner'
import { NativeBootOverlay } from '@/components/boot/NativeBootOverlay'
import { PwaSplashDismiss } from '@/components/boot/PwaSplashDismiss'
import {
  PWA_SPLASH_CSS,
  PWA_SPLASH_HEAD_SCRIPT,
  PWA_SPLASH_HTML,
  pwaStartupImages,
} from '@/components/boot/pwaSplash.mjs'
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
  // manifest name 은 Android 로딩 화면 문구를 숨기려고 "\u200B"(폭 없는 공백, 보이지 않는 문자)다(PROJECT_CONTEXT §20).
  // iOS "홈 화면에 추가" 기본 이름이 그 값을 쓰지 않도록 apple-mobile-web-app-title 로 고정한다.
  // startupImage: iOS 홈 화면 실행 시 첫 페인트 전까지 보이는 시작 이미지(기기별·라이트/다크).
  // 마크업·기기 목록의 단일 출처는 components/boot/pwaSplash.mjs (PROJECT_CONTEXT §20).
  appleWebApp: { title: 'Today Date', startupImage: pwaStartupImages() },
  // iOS 홈 화면 아이콘은 manifest icons 가 아니라 apple-touch-icon 을 쓴다 — 없으면 이름 첫 글자("T")로 나온다.
  // 기존 icon-512 와 같은 모양(하트 약 52%, 배경 #f5f3ff)의 180px 이다(PROJECT_CONTEXT §20).
  icons: { apple: '/apple-touch-icon.png' },
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
    // suppressHydrationWarning: head 스크립트가 하이드레이션 전에 html 에 pwa-splash 클래스를 붙인다.
    <html lang="ko" className={cn('font-sans', geistSans.variable)} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: PWA_SPLASH_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: PWA_SPLASH_HEAD_SCRIPT }} />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        {/* iOS 홈 화면 PWA 전용 스플래시 — 그 외 환경에선 display:none. 시작 이미지와 같은 자리·크기 */}
        <div id="pwa-splash" aria-hidden="true" dangerouslySetInnerHTML={{ __html: PWA_SPLASH_HTML }} />
        <PwaSplashDismiss />
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
