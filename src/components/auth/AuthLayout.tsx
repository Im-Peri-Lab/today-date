'use client'

import { type ReactNode } from 'react'
import { BrandHeader } from './BrandHeader'
import styles from './auth.module.css'

interface AuthLayoutProps {
  /** 브랜드 타이틀 (기본 "Today Date") */
  title?: string
  /** 브랜드 헤더 서브카피 */
  subtitle?: ReactNode
  /** 하트 pulse (인증 확인 중 등) */
  pulse?: boolean
  /** 중앙 본문 (헤더와 함께 뷰포트 중앙 정렬) */
  children: ReactNode
  /** 하단 링크 영역 (없으면 렌더 안 함) */
  footer?: ReactNode
}

/**
 * 인증 화면 공통 레이아웃.
 * - min-h-dvh flex column + safe-area + 라이트/다크 배경 (auth.module.css)
 * - 헤더 + 본문을 .center 그룹으로 묶어 뷰포트 중앙 정렬 (카드가 위/아래로
 *   치우치지 않음), 푸터만 하단에 고정
 * - 흰/검은 여백 방지는 globals.css 의 전역 body 배경이 SSR 시점부터 담당
 *   (JS 불필요). 여기 .page 는 그 위에 그라데이션을 얹는다.
 */
export function AuthLayout({ title, subtitle, pulse, children, footer }: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <div className={styles.center}>
        <BrandHeader title={title} subtitle={subtitle} pulse={pulse} />
        <div className={styles.body}>{children}</div>
      </div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </main>
  )
}
