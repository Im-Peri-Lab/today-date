'use client'

import { useEffect, type ReactNode } from 'react'
import { BrandHeader } from './BrandHeader'
import styles from './auth.module.css'

interface AuthShellProps {
  /** 브랜드 헤더 서브카피 */
  subtitle?: ReactNode
  /** 하트 pulse (인증 확인 중 등) */
  pulse?: boolean
  /** 중앙 본문 (수직 중앙 정렬) */
  children: ReactNode
  /** 하단 링크 영역 (없으면 렌더 안 함) */
  footer?: ReactNode
}

/**
 * 인증 화면 공통 셸.
 * - min-h-dvh flex column: 헤더(상단) / 본문(중앙) / 푸터(하단)
 * - 배경 + safe-area + 라이트/다크는 auth.module.css 가 담당
 * - 마운트 동안 <html> 에 auth-canvas 클래스를 붙여 canvas 배경까지 통일
 *   (주소창 토글·오버스크롤 시 흰 여백 방지, 다른 페이지엔 영향 없음)
 */
export function AuthShell({ subtitle, pulse, children, footer }: AuthShellProps) {
  useEffect(() => {
    document.documentElement.classList.add('auth-canvas')
    return () => document.documentElement.classList.remove('auth-canvas')
  }, [])

  return (
    <main className={styles.page}>
      <BrandHeader subtitle={subtitle} pulse={pulse} />
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </main>
  )
}
