'use client'

import Link from 'next/link'
import { Sparkles, MapPin, Check, ChevronRight } from 'lucide-react'
import { HomeFab } from '@/components/HomeFab'
import { PageHeader } from '@/components/PageHeader'
import { useDashboardStats, type DashboardStats } from '@/hooks/useDashboardStats'
import { STATUS_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

// ── 미리보기 문자열 생성 ─────────────────────────
function buildPreview(
  type: 'activity' | 'place',
  status: 'wishlist' | 'visited',
  count: number,
  previewTitles: string[]
): string {
  if (count === 0) {
    return status === 'visited' ? '아직 다녀온 곳이 없어요' : '아직 담은 곳이 없어요'
  }
  const unit = type === 'activity' ? '개' : '곳'
  const shown = previewTitles.slice(0, 2)
  const remaining = count - shown.length
  const base = shown.join(' · ')
  return remaining > 0 ? `${base} 외 ${remaining}${unit}` : base
}

// ── 칩 스타일 선택 ───────────────────────────────
function chipClass(type: 'activity' | 'place', status: 'wishlist' | 'visited'): string {
  if (type === 'activity' && status === 'wishlist') return styles.statChipActWish
  if (type === 'place' && status === 'wishlist') return styles.statChipPlcWish
  if (type === 'activity') return styles.statChipActVis
  return styles.statChipPlcVis
}

// ── StatRow ──────────────────────────────────────
function StatRow({
  type,
  status,
  count,
  previewTitles,
}: {
  type: 'activity' | 'place'
  status: 'wishlist' | 'visited'
  count: number
  previewTitles: string[]
}) {
  const label =
    type === 'activity'
      ? status === 'wishlist'
        ? '가보고 싶은 활동'
        : '다녀온 활동'
      : status === 'wishlist'
        ? '가보고 싶은 장소'
        : '다녀온 장소'

  const href = `/list?tab=${type === 'activity' ? 'activity' : 'place'}&status=${status}`
  const preview = buildPreview(type, status, count, previewTitles)
  const showBadge = status === 'visited' && count > 0
  const Icon = type === 'activity' ? Sparkles : MapPin

  return (
    <Link href={href} className={styles.statRow}>
      <div className={styles.statChipWrap}>
        <div className={cn(styles.statChip, chipClass(type, status))}>
          <Icon strokeWidth={1.75} />
        </div>
        {showBadge && (
          <span className={styles.statCheckBadge} aria-hidden="true">
            <Check strokeWidth={3} />
          </span>
        )}
      </div>
      <div className={styles.statRowContent}>
        <span className={styles.statRowTitle}>{label}</span>
        <span className={cn(styles.statRowPreview, count === 0 && styles.statRowPreviewEmpty)}>
          {preview}
        </span>
      </div>
      <ChevronRight className={styles.statRowChevron} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  )
}

// ── StatSection ──────────────────────────────────
function StatSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={styles.statSectionHeader}>{label}</p>
      <div className={styles.statSectionCard}>{children}</div>
    </div>
  )
}

// ── CtaCard ──────────────────────────────────────
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

// ── HomeDashboard ────────────────────────────────
export function HomeDashboard({ initialStats }: { initialStats?: DashboardStats }) {
  const { data } = useDashboardStats(initialStats)

  return (
    <div
      className={cn(
        styles.fill,
        'mx-auto w-full max-w-xl px-5 pb-16 pt-6 lg:max-w-3xl lg:px-8 lg:pb-24 lg:pt-12'
      )}
    >
      <PageHeader title="오늘, 우리 어떻게 보낼까?" subtitle="위시리스트에서 골라드릴게요 💜" />

      {/* 메인 CTA — 정사각 통통 카드 2열 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
        <CtaCard
          href="/recommend/activity"
          icon={<Sparkles className="h-5 w-5" strokeWidth={1.75} />}
          title="오늘 뭐할까?"
          subtitle="활동 추천 받기"
        />
        <CtaCard
          href="/recommend/place"
          icon={<MapPin className="h-5 w-5" strokeWidth={1.75} />}
          title="오늘 뭐먹을까?"
          subtitle="장소 추천 받기"
        />
      </div>

      {/* 통계 — 행형 리스트 2섹션 */}
      <div className={styles.statSections}>
        <StatSection label={STATUS_LABELS.wishlist}>
          <StatRow
            type="activity"
            status="wishlist"
            count={data?.wishlistActivities ?? 0}
            previewTitles={data?.wishlistActivityTitles ?? []}
          />
          <StatRow
            type="place"
            status="wishlist"
            count={data?.wishlistPlaces ?? 0}
            previewTitles={data?.wishlistPlaceTitles ?? []}
          />
        </StatSection>

        <StatSection label={STATUS_LABELS.visited}>
          <StatRow
            type="activity"
            status="visited"
            count={data?.visitedActivities ?? 0}
            previewTitles={data?.visitedActivityTitles ?? []}
          />
          <StatRow
            type="place"
            status="visited"
            count={data?.visitedPlaces ?? 0}
            previewTitles={data?.visitedPlaceTitles ?? []}
          />
        </StatSection>
      </div>

      <HomeFab />
    </div>
  )
}
