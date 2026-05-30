'use client'

import Link from 'next/link'
import { Sparkles, MapPin, List } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { LogoutButton } from '@/components/LogoutButton'
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
}: {
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className={cn(styles.card, 'p-4')}>
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
    <div className="mx-auto w-full max-w-xl px-5 pb-10 pt-3">
      {/* 헤더: 브랜드 + 빠른 액션 */}
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MiniHeart />
          <span className={styles.brand}>Today Date</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/list" className={styles.iconBtn} aria-label="목록 보기">
            <List className="h-[18px] w-[18px]" />
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* 인사 */}
      <div className="mb-7">
        <h1 className={styles.greeting}>오늘은 뭐 할까?</h1>
        <p className={cn('mt-1.5 text-sm', styles.sub)}>마음에 드는 걸 골라봐요 💜</p>
      </div>

      {/* 메인 CTA — 흰/다크 카드 + 그라데이션 아이콘(강조는 아이콘에만) */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              위시리스트에서 골라드려요
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
            <span className={cn('block text-base font-semibold', styles.ink)}>어디 갈까?</span>
            <span className={cn('mt-0.5 block text-[13px] leading-snug', styles.sub)}>
              메뉴와 위치로 골라드려요
            </span>
          </span>
        </Link>
      </div>

      {/* 통계 — 2x2, 큰 숫자 + 작은 라벨 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="활동" value={data?.totalActivities} loading={isLoading} />
        <StatCard label="장소" value={data?.totalPlaces} loading={isLoading} />
        <StatCard label="다녀온 곳" value={data?.totalVisited} loading={isLoading} />
        <StatCard label="이번 달" value={data?.visitedThisMonth} loading={isLoading} />
      </div>

      {/* 보조 링크 */}
      <div className="mt-7 flex items-center justify-center gap-5 text-sm">
        <Link href="/activities/new" className={styles.textLink}>
          + 활동 추가
        </Link>
        <Link href="/places/new" className={styles.textLink}>
          + 장소 추가
        </Link>
      </div>
    </div>
  )
}
