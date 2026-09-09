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

// ── 파트너 초대 안내 배너 ────────────────────────
/**
 * SOLO(멤버 1명) 상태에서만 보이는 초대 진입점.
 *
 * PAIRED 에서는 초대할 자리가 없으므로 아예 렌더하지 않는다 — 서버가 POST /api/auth/invite
 * 를 409 로 막지만(§ lib/auth/invite.ts), 누를 수 있는 버튼을 남겨두면 눌러야 알 수 있는
 * 실패가 된다. 상태는 서버 컴포넌트가 세션의 커플로 판별해 내려준다(§ app/(home)/page.tsx).
 *
 * 카드가 아니라 **안내 배너**(`styles.notice`)이고, 자리도 추천 CTA 위 —
 * 제목/서브카피 바로 아래다. 이유는 계위다:
 *   - 추천 CTA·통계 행은 "여러 번 쓰는 기능"이고 서로 대등한 선택지다.
 *   - 이건 선택지가 아니라 **아직 갖춰지지 않은 상태의 통보**다("아직 둘이 아니에요").
 * 흰 카드 표면·그림자·부상을 쓰면 기능 버튼 중 하나로 읽혀 그 신호가 사라지므로,
 * accent 틴트 면 + 틴트 보더로 표면 자체를 분리한다(§ screens.module.css .notice).
 * 페어링이 끝나면 사라지는 한시적 배너라는 점도 배너 계위가 맞는 근거다.
 */
function PartnerInviteNotice() {
  return (
    <Link href="/partner" className={cn(styles.notice, 'mt-5')}>
      <span className={styles.noticeIcon}>
        <UserPlus className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={styles.noticeTitle}>아직 혼자 쓰고 있어요</span>
        <span className={styles.noticeDesc}>
          파트너를 초대해 함께 위시리스트를 쌓아보세요
        </span>
      </span>
      <ChevronRight className={styles.noticeChevron} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  )
}

// ── HomeDashboard ────────────────────────────────
export function HomeDashboard({
  initialStats,
  workspaceState,
}: {
  initialStats?: DashboardStats
  /** 커플을 특정할 수 없으면 null — 그때는 초대 진입점을 감춘다(§ PartnerInviteNotice). */
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

      {/* 페어링 전 상태 안내 — 기능 카드들보다 위(별도 계위) */}
      {workspaceState === 'SOLO' && <PartnerInviteNotice />}

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
