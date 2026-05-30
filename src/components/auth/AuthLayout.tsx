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
  /** 링크 영역 (없으면 렌더 안 함) */
  footer?: ReactNode
  /**
   * footer 를 화면 하단 고정이 아니라 콘텐츠 그룹(카드 바로 아래)에 포함시킨다.
   * 카드와 의미상 연결된 보조 액션(예: "잠금 화면으로 돌아가기")에 사용.
   * 기본 false = 하단 고정 (lock 의 "패스코드를 잊으셨나요?" 처럼).
   */
  inlineFooter?: boolean
}

/**
 * 인증 화면 공통 레이아웃.
 * - min-h-dvh flex column + safe-area + 라이트/다크 배경 (auth.module.css)
 * - 헤더 + 본문(+inlineFooter)을 .center 그룹으로 묶어 뷰포트 중앙 정렬
 *   (카드가 위/아래로 치우치지 않음)
 * - inlineFooter=true: footer 가 카드 바로 아래(.bodyGroup, 20px 갭)에 포함돼
 *   콘텐츠 그룹과 함께 중앙 정렬된다.
 * - inlineFooter=false(기본): footer 는 .footer 로 화면 하단에 고정된다.
 * - 흰/검은 여백 방지는 globals.css 의 전역 body 배경이 SSR 시점부터 담당
 *   (JS 불필요). 여기 .page 는 그 위에 그라데이션을 얹는다.
 */
export function AuthLayout({ title, subtitle, pulse, children, footer, inlineFooter = false }: AuthLayoutProps) {
  const showInline = footer && inlineFooter
  const showPinned = footer && !inlineFooter

  return (
    <main className={styles.page}>
      <div className={styles.center}>
        <BrandHeader title={title} subtitle={subtitle} pulse={pulse} />
        {showInline ? (
          <div className={styles.bodyGroup}>
            <div className={styles.body}>{children}</div>
            {footer}
          </div>
        ) : (
          <div className={styles.body}>{children}</div>
        )}
      </div>
      {showPinned && <footer className={styles.footer}>{footer}</footer>}
    </main>
  )
}
