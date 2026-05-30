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
      className={cn(
        styles.card,
        styles.cardInteractive,
        'flex items-center gap-4 p-5 lg:gap-6 lg:px-7 lg:py-8'
      )}
    >
      <span className={cn(styles.gradIcon, 'h-12 w-12 shrink-0 lg:h-16 lg:w-16')}>{icon}</span>
      <span className="min-w-0">
        <span className={cn('block text-base font-semibold lg:text-xl', styles.ink)}>{title}</span>
        <span className={cn('mt-0.5 block text-[13px] leading-snug lg:mt-1 lg:text-base', styles.sub)}>
          {subtitle}
        </span>
      </span>
    </Link>
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
    <div className={cn(styles.card, accent && styles.statCardAccent, 'p-4 lg:p-6')}>
      {loading ? (
        <Skeleton className="h-8 w-12 lg:h-10" />
      ) : (
        <p className={cn(styles.statNum, 'text-3xl lg:text-4xl')}>{value ?? 0}</p>
      )}
      <p className={cn('mt-1 text-xs lg:mt-2 lg:text-sm', accent ? styles.accent : styles.sub)}>
        {label}
      </p>
    </div>
  )
}

export function HomeDashboard() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div
      className={cn(
        styles.fill,
        'mx-auto w-full max-w-xl px-5 pb-16 pt-6 lg:max-w-6xl lg:px-8 lg:pb-24 lg:pt-12'
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
      <div className="mt-12 lg:mt-16">
        <h1 className={cn(styles.greeting, 'text-3xl lg:text-5xl')}>오늘, 우리 어떻게 보낼까?</h1>
        <p className={cn('mt-3 text-sm lg:mt-4 lg:text-lg', styles.sub)}>
          위시리스트에서 골라드릴게요 💜
        </p>
      </div>

      {/* 메인 CTA — 흰/다크 카드 + 그라데이션 아이콘(강조는 아이콘에만) */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-12 lg:gap-5">
        <CtaCard
          href="/recommend/activity"
          icon={<Sparkles className="h-[22px] w-[22px] lg:h-8 lg:w-8" strokeWidth={1.75} />}
          title="오늘 뭐할까?"
          subtitle="활동 추천 받기"
        />
        <CtaCard
          href="/recommend/place"
          icon={<MapPin className="h-[22px] w-[22px] lg:h-8 lg:w-8" strokeWidth={1.75} />}
          title="오늘 어디갈까?"
          subtitle="장소 추천 받기"
        />
      </div>

      {/* 통계 — 모바일 2x2 / 데스크탑 1x4, 위 콘텐츠와 분리 */}
      <div className={cn('mt-12 lg:mt-20', styles.sectionTop)}>
        <p className={cn('mb-3 lg:mb-5', styles.statLabel)}>우리의 기록</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          <StatCard label="활동" value={data?.totalActivities} loading={isLoading} />
          <StatCard label="장소" value={data?.totalPlaces} loading={isLoading} />
          <StatCard label="다녀온 곳" value={data?.totalVisited} loading={isLoading} accent />
          <StatCard label="이번 달" value={data?.visitedThisMonth} loading={isLoading} />
        </div>
      </div>

      {/* 추가 — 우하단 FAB (활동/장소 메뉴) */}
      <HomeFab />
    </div>
  )
}
