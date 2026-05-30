'use client'

import Link from 'next/link'
import { Sparkles, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeMenu } from '@/components/HomeMenu'
import { HomeFab } from '@/components/HomeFab'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/** 보라→핑크 그라데이션 하트 (auth BrandHeader 와 동일 모티프) */
function MiniHeart() {
  return (
    <svg
      className={cn(styles.miniHeart, 'h-6 w-6 lg:h-7 lg:w-7')}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Today Date"
    >
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

function CtaCard({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Link
      href={href}
      className={cn(styles.card, styles.cardInteractive, 'flex flex-col p-5')}
    >
      <span className={cn(styles.gradIcon, 'h-8 w-8')}>{icon}</span>
      <span className="mt-4 block">
        <span className={cn('block text-base font-semibold lg:text-lg', styles.ink)}>{title}</span>
        <span className={cn('mt-0.5 block text-sm', styles.sub)}>{subtitle}</span>
      </span>
    </Link>
  )
}

/** 통계 카드 — CTA와 동일한 카드 토큰. 숫자 강조 + 라벨, 호버 없음(정보 전용) */
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
    <div className={cn(styles.card, 'flex flex-col p-4')}>
      {loading ? (
        <Skeleton className="h-7 w-10" />
      ) : (
        <span className={cn(styles.statNum, 'text-2xl lg:text-3xl')}>{value ?? 0}</span>
      )}
      <span className={cn('mt-1 text-sm', styles.sub)}>{label}</span>
    </div>
  )
}

export function HomeDashboard() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div
      className={cn(
        styles.fill,
        'mx-auto w-full max-w-xl px-5 pb-16 pt-6 lg:max-w-3xl lg:px-8 lg:pb-24 lg:pt-12'
      )}
    >
      {/* 헤더: 브랜드 + 미니멀 메뉴 */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MiniHeart />
          <span className={cn(styles.brand, 'lg:text-lg')}>Today Date</span>
        </div>
        <HomeMenu />
      </header>

      {/* Hero */}
      <div className="mt-8 lg:mt-10">
        <h1 className={cn(styles.greeting, 'text-2xl lg:text-4xl')}>오늘, 우리 어떻게 보낼까?</h1>
        <p className={cn('mt-1 text-sm lg:mt-1.5 lg:text-lg', styles.sub)}>
          위시리스트에서 골라드릴게요 💜
        </p>
      </div>

      {/* 메인 CTA — 정사각 통통 카드 2열, 아이콘 상단 + 텍스트 하단 */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-8 lg:gap-4">
        <CtaCard
          href="/recommend/activity"
          icon={<Sparkles className="h-5 w-5" strokeWidth={1.75} />}
          title="오늘 뭐할까?"
          subtitle="활동 추천 받기"
        />
        <CtaCard
          href="/recommend/place"
          icon={<MapPin className="h-5 w-5" strokeWidth={1.75} />}
          title="오늘 어디갈까?"
          subtitle="장소 추천 받기"
        />
      </div>

      {/* 통계 — CTA와 동일한 카드 언어, 더 컴팩트(보조 정보). 두 그룹 */}
      <div className="mt-6">
        <div>
          <p className={cn('mb-2 text-sm font-medium', styles.sub)}>위시리스트</p>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <StatCard label="활동" value={data?.totalActivities} loading={isLoading} />
            <StatCard label="장소" value={data?.totalPlaces} loading={isLoading} />
          </div>
        </div>
        <div className="mt-5">
          <p className={cn('mb-2 text-sm font-medium', styles.sub)}>함께한 기록</p>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <StatCard label="다녀온 곳" value={data?.totalVisited} loading={isLoading} />
            <StatCard label="이번 달" value={data?.visitedThisMonth} loading={isLoading} />
          </div>
        </div>
      </div>

      {/* 추가 — 우하단 FAB (활동/장소 메뉴) */}
      <HomeFab />
    </div>
  )
}
