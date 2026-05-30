'use client'

import Link from 'next/link'
import { Sparkles, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeMenu } from '@/components/HomeMenu'
import { HomeFab } from '@/components/HomeFab'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/** 보라→핑크 그라데이션 하트 (auth BrandHeader 와 동일 모티프, 작게) */
function MiniHeart() {
  return (
    <svg className={styles.miniHeart} viewBox="0 0 24 24" role="img" aria-label="Today Date">
      <defs>
        <linearGradient id="homeHeartGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        fill="url(#homeHeartGradient)"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  )
}

function StatCard({
  label,
  value,
  loading,
  accent,
}: {
  label: string
  value: number | undefined
  loading: boolean
  accent?: boolean
}) {
  return (
    <div className={cn(styles.card, accent && styles.statCardAccent, 'p-4')}>
      {loading ? (
        <Skeleton className="h-7 w-10" />
      ) : (
        <p className={styles.statNum}>{value ?? 0}</p>
      )}
      <p className={cn('mt-1 text-xs', styles.sub)}>{label}</p>
    </div>
  )
}

export function HomeDashboard() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div className={cn(styles.fill, 'mx-auto w-full max-w-xl px-5 pb-6 pt-3 lg:max-w-5xl')}>
      {/* 헤더: 브랜드 + 미니멀 메뉴 (상단 고정) */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MiniHeart />
          <span className={styles.brand}>Today Date</span>
        </div>
        <HomeMenu />
      </header>

      {/* 본문: 인사 → CTA → 통계 (남은 공간에서 세로 중앙) */}
      <div className={cn(styles.homeCenter, 'gap-8 py-8')}>
        {/* 인사 */}
        <div>
          <h1 className={styles.greeting}>오늘, 우리 어떻게 보낼까?</h1>
          <p className={cn('mt-1.5 text-sm', styles.sub)}>위시리스트에서 골라드릴게요 💜</p>
        </div>

        {/* 메인 CTA — 흰/다크 카드 + 그라데이션 아이콘(강조는 아이콘에만) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/recommend/activity"
            className={cn(styles.card, styles.cardInteractive, 'flex items-center gap-4 p-5')}
          >
            <span className={cn(styles.gradIcon, 'h-12 w-12 shrink-0')}>
              <Sparkles className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className={cn('block text-base font-semibold', styles.ink)}>오늘 뭐할까?</span>
              <span className={cn('mt-0.5 block text-[13px] leading-snug', styles.sub)}>
                활동 추천 받기
              </span>
            </span>
          </Link>

          <Link
            href="/recommend/place"
            className={cn(styles.card, styles.cardInteractive, 'flex items-center gap-4 p-5')}
          >
            <span className={cn(styles.gradIcon, 'h-12 w-12 shrink-0')}>
              <MapPin className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className={cn('block text-base font-semibold', styles.ink)}>오늘 어디갈까?</span>
              <span className={cn('mt-0.5 block text-[13px] leading-snug', styles.sub)}>
                장소 추천 받기
              </span>
            </span>
          </Link>
        </div>

        {/* 통계 — 모바일 2x2 / 데스크탑 1x4, "다녀온 곳" 강조 */}
        <div>
          <p className={cn('mb-3', styles.statLabel)}>우리의 기록</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="활동" value={data?.totalActivities} loading={isLoading} />
            <StatCard label="장소" value={data?.totalPlaces} loading={isLoading} />
            <StatCard label="다녀온 곳" value={data?.totalVisited} loading={isLoading} accent />
            <StatCard label="이번 달" value={data?.visitedThisMonth} loading={isLoading} />
          </div>
        </div>
      </div>

      {/* 추가 — 우하단 FAB (활동/장소 메뉴) */}
      <HomeFab />
    </div>
  )
}
