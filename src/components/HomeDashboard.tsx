'use client'

import Link from 'next/link'
import { Sparkles, UtensilsCrossed, Check, ChevronRight, ArrowRight, UserPlus } from 'lucide-react'
import { HomeFab } from '@/components/HomeFab'
import { PageHeader } from '@/components/PageHeader'
import { useDashboardStats, type DashboardStats } from '@/hooks/useDashboardStats'
import type { WorkspaceState } from '@/lib/auth/couple'
import { STATUS_LABELS } from '@/lib/labels'
import { HOME_RETURN_TO } from '@/lib/listReturn'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

// ── 칩 스타일 선택 ───────────────────────────────
function chipClass(type: 'activity' | 'place', status: 'wishlist' | 'visited'): string {
  if (type === 'activity' && status === 'wishlist') return styles.statChipActWish
  if (type === 'place' && status === 'wishlist') return styles.statChipPlcWish
  if (type === 'activity') return styles.statChipActVis
  return styles.statChipPlcVis
}

// ── StatTile ─────────────────────────────────────
/**
 * 섹션(가보고 싶은 곳/다녀온 곳) 안의 바로가기 타일. 상태는 섹션 제목이 전담하므로
 * 타일 제목은 종류("액티비티"/"다이닝")만 쓴다.
 *
 * 둘째 줄은 폭에 따라 달라진다(lg = 1024px, /list 탭과 같은 기준):
 *   - 모바일: 개수만("3개"/"2곳") — 타일 하나가 ~169px라 항목명을 넣으면 "뮤지…"로 잘린다.
 *   - lg 이상: "최근 항목명 외 N개/N곳".
 * 0개일 때는 폭과 무관하게 빈 상태 문구를 그대로 쓴다("0개"로 쓰지 않는다).
 */
function StatTile({
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
  const label = type === 'activity' ? '액티비티' : '다이닝'
  const unit = type === 'activity' ? '개' : '곳'
  const href = `/list?tab=${type === 'activity' ? 'activity' : 'place'}&status=${status}`
  const showBadge = status === 'visited' && count > 0
  const Icon = type === 'activity' ? Sparkles : UtensilsCrossed
  const recent = previewTitles[0]
  const more = count - 1

  return (
    <Link href={href} className={cn(styles.statSectionCard, styles.statRow, styles.statTile)}>
      {/* 1단: 작은 아이콘 + 제목 + 화살표 (한 줄) */}
      <div className={styles.statTileHead}>
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
        <span className={cn(styles.statRowTitle, styles.statTileTitle)}>{label}</span>
        <ChevronRight className={styles.statRowChevron} strokeWidth={1.75} aria-hidden="true" />
      </div>
      {/* 2단: 텍스트만, 카드 전체 폭 */}
      <div className={styles.statTileBody}>
        {count === 0 ? (
          <span className={cn(styles.statRowPreview, styles.statRowPreviewEmpty)}>
            {status === 'visited' ? '아직 다녀온' : '아직 담은'}{' '}
            {/* 모바일은 두 섹션 모두 "곳이 없어요"가 둘째 줄이 되도록 접는다(위아래 통일) */}
            <br className="lg:hidden" />
            곳이 없어요
          </span>
        ) : recent ? (
          <>
            <span className={cn(styles.statRowPreview, styles.statRowItem)}>{recent}</span>
            {more > 0 && (
              <span className={cn(styles.statRowPreview, styles.statRowMore)}>
                외 {more}
                {unit}
              </span>
            )}
            <span className={cn(styles.statRowPreview, styles.statRowRecent)}>
              <span className={styles.statRowRecentTitle}>{recent}</span>
              {more > 0 && (
                <span className={styles.statRowRecentMore}>
                  {' '}
                  외 {more}
                  {unit}
                </span>
              )}
            </span>
          </>
        ) : (
          // 개수는 있는데 제목을 못 받은 경우(방어) — 폭과 무관하게 개수만
          <span className={styles.statRowPreview}>
            {count}
            {unit}
          </span>
        )}
      </div>
    </Link>
  )
}

// ── StatSection ──────────────────────────────────
function StatSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={styles.statSectionHeader}>{label}</p>
      <div className={styles.statGrid}>{children}</div>
    </div>
  )
}

// ── CtaCard ──────────────────────────────────────
/**
 * 추천 CTA 배너 — 배경 이미지(public/images) + 왼쪽 스크림 위에 영문 라벨·제목·설명, 오른쪽 아래 원형 화살표.
 * 배경 크기·위치·스크림은 screens.module.css 의 .ctaCard 변수가 폭별로 정한다.
 */
function CtaCard({
  href,
  kind,
  eyebrow,
  title,
  subtitle,
}: {
  href: string
  kind: 'activity' | 'dining'
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        styles.card,
        styles.cardInteractive,
        styles.ctaCard,
        kind === 'activity' ? styles.ctaActivity : styles.ctaDining
      )}
    >
      <span className={styles.ctaText}>
        <span className={styles.ctaEyebrow}>{eyebrow}</span>
        <span className={styles.ctaTitle}>{title}</span>
        <span className={styles.ctaSub}>{subtitle}</span>
      </span>
      <span className={styles.ctaArrow} aria-hidden="true">
        <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
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
        'mx-auto w-full max-w-xl px-5 pb-20 pt-4 lg:max-w-3xl lg:px-8 lg:pb-24 lg:pt-12'
      )}
    >
      <PageHeader title="오늘, 우리 어떻게 보낼까?" subtitle="우리 둘의 데이트를 채워가는 공간" />

      {/* 페어링 전 상태 안내 — 기능 카드들보다 위(별도 계위) */}
      {workspaceState === 'SOLO' && <PartnerInviteNotice />}

      {/* 메인 CTA — 모바일 1열 배너 / 데스크탑(lg) 2열 */}
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <CtaCard
          href="/recommend/activity"
          kind="activity"
          eyebrow="ACTIVITY"
          title="오늘 뭐할까?"
          subtitle="딱 맞는 데이트 활동 추천 받기"
        />
        <CtaCard
          href="/recommend/place"
          kind="dining"
          eyebrow="DINING"
          title="오늘 뭐먹을까?"
          subtitle="딱 좋은 데이트 맛집 추천 받기"
        />
      </div>

      {/* 배너 ↔ 첫 섹션 여백(모바일 16~30, 남는 높이만큼 늘어남 — lg 는 .statSections margin-top) */}
      <div className={styles.statSlack} aria-hidden />

      {/* 통계 — 행형 리스트 2섹션 */}
      <div className={styles.statSections}>
        <StatSection label={STATUS_LABELS.wishlist}>
          <StatTile
            type="activity"
            status="wishlist"
            count={data?.wishlistActivities ?? 0}
            previewTitles={data?.wishlistActivityTitles ?? []}
          />
          <StatTile
            type="place"
            status="wishlist"
            count={data?.wishlistPlaces ?? 0}
            previewTitles={data?.wishlistPlaceTitles ?? []}
          />
        </StatSection>

        {/* 섹션 사이 여백(모바일 12~15 — lg 는 .statSections gap) */}
        <div className={styles.statGapSlack} aria-hidden />

        <StatSection label={STATUS_LABELS.visited}>
          <StatTile
            type="activity"
            status="visited"
            count={data?.visitedActivities ?? 0}
            previewTitles={data?.visitedActivityTitles ?? []}
          />
          <StatTile
            type="place"
            status="visited"
            count={data?.visitedPlaces ?? 0}
            previewTitles={data?.visitedPlaceTitles ?? []}
          />
        </StatSection>
      </div>

      <HomeFab returnTo={HOME_RETURN_TO} />
    </div>
  )
}
