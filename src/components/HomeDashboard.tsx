'use client'

import Link from 'next/link'
import { Sparkles, MapPin, Check, ChevronRight, UserPlus } from 'lucide-react'
import { HomeFab } from '@/components/HomeFab'
import { PageHeader } from '@/components/PageHeader'
import { useDashboardStats, type DashboardStats } from '@/hooks/useDashboardStats'
import type { WorkspaceState } from '@/lib/auth/couple'
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
        ? '가보고 싶은 액티비티'
        : '다녀온 액티비티'
      : status === 'wishlist'
        ? '가보고 싶은 다이닝'
        : '다녀온 다이닝'

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

// ── 파트너 초대 진입 카드 ────────────────────────
/**
 * SOLO(멤버 1명) 상태에서만 보이는 초대 진입점.
 *
 * PAIRED 에서는 초대할 자리가 없으므로 아예 렌더하지 않는다 — 서버가 POST /api/auth/invite
 * 를 409 로 막지만(§ lib/auth/invite.ts), 누를 수 있는 버튼을 남겨두면 눌러야 알 수 있는
 * 실패가 된다. 상태는 서버 컴포넌트가 세션의 커플로 판별해 내려준다(§ app/(home)/page.tsx).
 *
 * 통계 리스트(StatSection) 안의 한 행이 아니라 추천 CTA 바로 아래의 독립 카드다.
 * 성격이 다른 항목이기 때문이다 — 통계 행은 "쌓아둔 콘텐츠 보기"로 반복해서 누르는
 * 자리이고, 이 카드는 계정을 한 번 세팅하는 온보딩 액션이라 목록에 섞이면 콘텐츠처럼
 * 읽힌다. 카드 위계도 통계 카드(조연, 그림자 최약)가 아닌 CTA 계열 표면
 * (`card` + `cardInteractive`, 그림자 표준 + `gradIcon`)을 쓴다(§ 디자인 3).
 */
function PartnerInviteCard() {
  return (
    <Link
      href="/partner"
      className={cn(
        styles.card,
        styles.cardInteractive,
        'mt-3 flex items-center gap-3 p-4 lg:mt-4',
      )}
    >
      <span className={cn(styles.gradIcon, 'h-10 w-10 shrink-0')}>
        <UserPlus className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-base font-semibold', styles.ink)}>파트너 초대</span>
        <span className={cn('mt-0.5 block text-sm', styles.sub)}>
          둘이 함께 위시리스트를 쌓아보세요
        </span>
      </span>
      <ChevronRight className={styles.statRowChevron} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  )
}

// ── HomeDashboard ────────────────────────────────
export function HomeDashboard({
  initialStats,
  workspaceState,
}: {
  initialStats?: DashboardStats
  /** 커플을 특정할 수 없으면 null — 그때는 초대 진입점을 감춘다(§ PartnerInviteCard). */
  workspaceState?: WorkspaceState | null
}) {
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
          subtitle="액티비티 추천 받기"
        />
        <CtaCard
          href="/recommend/place"
          icon={<MapPin className="h-5 w-5" strokeWidth={1.75} />}
          title="오늘 뭐먹을까?"
          subtitle="다이닝 추천 받기"
        />
      </div>

      {/* 계정/온보딩 액션 — 콘텐츠 리스트보다 위, CTA 바로 아래 */}
      {workspaceState === 'SOLO' && <PartnerInviteCard />}

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
