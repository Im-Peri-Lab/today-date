'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { MiniHeart } from '@/components/BrandMark'
import { HomeMenu } from '@/components/HomeMenu'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 메인 화면 공용 페이지 헤더 — 브랜드(로고) 줄 + 제목/서브카피.
 * 헤더~제목~서브카피 블록의 세로 간격을 두 화면(홈/리스트)에서 픽셀 단위로 동일하게 유지.
 * homeNav=true 면 하위 화면용: 로고/홈 버튼이 홈(`/`)으로 이동.
 */
export function PageHeader({
  title,
  subtitle,
  homeNav = false,
}: {
  title: string
  subtitle: string
  homeNav?: boolean
}) {
  const brand = (
    <>
      <MiniHeart />
      <span className={cn(styles.brand, 'lg:text-lg')}>Today Date</span>
    </>
  )

  return (
    <>
      <header className="flex items-center justify-between">
        {homeNav ? (
          <Link href="/" className="flex items-center gap-2.5" aria-label="홈으로">
            {brand}
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">{brand}</div>
        )}
        <div className="flex items-center gap-1">
          {homeNav && (
            <Link href="/" className={styles.iconBtn} aria-label="홈으로">
              <Home className="h-5 w-5" />
            </Link>
          )}
          <HomeMenu />
        </div>
      </header>

      <div className="mt-8 lg:mt-10">
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageSubtitle}>{subtitle}</p>
      </div>
    </>
  )
}
