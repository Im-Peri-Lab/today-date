'use client'

import Link from 'next/link'
import { Zap, MapPin, CheckCircle2, CalendarHeart, List } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { LogoutButton } from '@/components/LogoutButton'
import { useDashboardStats } from '@/hooks/useDashboardStats'

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className="rounded-xl bg-white/70 p-4 ring-1 ring-violet-100">
      <div className="mb-1 flex items-center gap-1.5 text-violet-500">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-10" />
      ) : (
        <p className="text-2xl font-bold text-violet-800">{value ?? 0}</p>
      )}
    </div>
  )
}

export function HomeDashboard() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-violet-500">우리의 데이트 플래너 💜</p>
          <h1 className="text-2xl font-bold text-violet-900">오늘 어떤 데이트 하지?</h1>
        </div>
        <div className="w-28 shrink-0">
          <LogoutButton />
        </div>
      </div>

      {/* 메인 CTA */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/recommend/activity"
          className="group rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <div className="mb-2 text-3xl">🎯</div>
          <div className="text-lg font-bold">오늘 뭐할까?</div>
          <div className="text-sm text-violet-100">조건에 맞는 활동 추천받기</div>
        </Link>
        <Link
          href="/recommend/place"
          className="group rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 p-5 text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <div className="mb-2 text-3xl">📍</div>
          <div className="text-lg font-bold">어디 갈까?</div>
          <div className="text-sm text-pink-100">분위기 맞는 장소 추천받기</div>
        </Link>
      </div>

      {/* 통계 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="총 활동"
          value={data?.totalActivities}
          loading={isLoading}
        />
        <StatCard
          icon={<MapPin className="h-4 w-4" />}
          label="총 장소"
          value={data?.totalPlaces}
          loading={isLoading}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="다녀온 곳"
          value={data?.totalVisited}
          loading={isLoading}
        />
        <StatCard
          icon={<CalendarHeart className="h-4 w-4" />}
          label="이번 달 다녀온 곳"
          value={data?.visitedThisMonth}
          loading={isLoading}
        />
      </div>

      {/* 빠른 링크 */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <Link
          href="/list"
          className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-800"
        >
          <List className="h-4 w-4" />
          목록 보기
        </Link>
        <Link href="/activities/new" className="text-violet-600 hover:text-violet-800">
          + 활동 추가
        </Link>
        <Link href="/places/new" className="text-violet-600 hover:text-violet-800">
          + 장소 추가
        </Link>
      </div>
    </div>
  )
}
