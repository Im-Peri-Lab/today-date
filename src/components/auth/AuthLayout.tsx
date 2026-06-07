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
   * (호환용 — 현재 무시됨) footer 는 항상 콘텐츠 그룹 안 in-flow 로 렌더된다.
   */
  inlineFooter?: boolean
}

/**
 * 인증 화면 공통 레이아웃.
 * - .page: min-height:100svh flex column + safe-area + 라이트/다크 배경 (auth.module.css)
 * - 헤더 + 본문 + footer 를 하나의 in-flow 그룹(.group)으로 묶고 margin:auto 로 정렬:
 *   여유가 있으면 뷰포트 세로 중앙, 콘텐츠가 svh 를 넘으면 상단부터 자연 스크롤된다(잘림 구조적으로 불가).
 * - footer 는 항상 콘텐츠 그룹 안(.bodyGroup, 카드 아래 20px)에 포함된다(하단 고정 모드 없음).
 * - 흰/검은 여백 방지는 globals.css 의 전역 body 배경이 SSR 시점부터 담당(JS 불필요).
 *   여기 .page 는 그 위에 그라데이션을 얹는다.
 */
export function AuthLayout({ title, subtitle, pulse, children, footer }: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <div className={styles.center}>
        {/* 콘텐츠 한 덩어리: margin:auto 로 여유 시 세로 중앙, 넘치면 상단부터 자연 스크롤(잘림 불가) */}
        <div className={styles.group}>
          <BrandHeader title={title} subtitle={subtitle} pulse={pulse} />
          <div className={styles.bodyGroup}>
            <div className={styles.body}>{children}</div>
            {footer}
          </div>
        </div>
      </div>
    </main>
  )
}
