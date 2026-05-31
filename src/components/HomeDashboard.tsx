'use client'

import Link from 'next/link'
import { Sparkles, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeMenu } from '@/components/HomeMenu'
import { HomeFab } from '@/components/HomeFab'
import { MiniHeart } from '@/components/BrandMark'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

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

/** 통계 카드 — /list 진입구. 숫자 강조 + 라벨, 탭 가능(약한 hover/active) */
function StatCard({
  href,
  label,
  value,
  loading,
}: {
  href: string
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        styles.card,
        'flex flex-col p-4 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]'
      )}
    >
      {loading ? (
        <Skeleton className="h-7 w-10" />
      ) : (
        <span className={cn(styles.statNum, 'text-2xl lg:text-3xl')}>{value ?? 0}</span>
      )}
      <span className={cn('mt-1 text-sm', styles.sub)}>{label}</span>
    </Link>
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

      {/* 통계 — 위시리스트 / 다녀온 곳, 각 [활동][장소]. 탭 시 해당 탭+토글로 진입 */}
      <div className="mt-6">
        <div>
          <p className={cn('mb-2 text-sm font-medium', styles.sub)}>위시리스트</p>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <StatCard
              href="/list?tab=activity&status=wishlist"
              label="활동"
              value={data?.wishlistActivities}
              loading={isLoading}
            />
            <StatCard
              href="/list?tab=place&status=wishlist"
              label="장소"
              value={data?.wishlistPlaces}
              loading={isLoading}
            />
          </div>
        </div>
        <div className="mt-5">
          <p className={cn('mb-2 text-sm font-medium', styles.sub)}>다녀온 곳</p>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <StatCard
              href="/list?tab=activity&status=visited"
              label="활동"
              value={data?.visitedActivities}
              loading={isLoading}
            />
            <StatCard
              href="/list?tab=place&status=visited"
              label="장소"
              value={data?.visitedPlaces}
              loading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* 추가 — 우하단 FAB (활동/장소 메뉴) */}
      <HomeFab />
    </div>
  )
}
