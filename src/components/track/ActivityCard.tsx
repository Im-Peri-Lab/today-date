'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Clock, StickyNote, MapPin } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { ItemMenu } from './ItemMenu'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { DURATION_LABELS, TIME_OF_DAY_LABELS, TIME_OF_DAY_ICONS, STATUS_LABELS } from '@/lib/labels'
import { buildDetailHref } from '@/lib/listReturn'
import { stashActivityDuplicate } from '@/lib/duplicatePrefill'
import { formatDotDateRange } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Activity } from '@/types'
import styles from '@/components/screens.module.css'

interface ActivityCardProps {
  activity: Activity
  hideMenu?: boolean
  actionSlot?: ReactNode
  returnTo?: string
}

export function ActivityCard({ activity, hideMenu, actionSlot, returnTo }: ActivityCardProps) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const del = useDeleteActivity()
  const update = useUpdateActivity()

  // 카드 ⋮ 메뉴발 화면 이동: router.push 는 프로그레스 바가 자동으로 뜨지 않아
  // 등록/삭제 경로와 동일하게 push 직전 topLoader.start()로 진행 표시를 맞춘다.
  function navigate(href: string) {
    topLoader.start()
    router.push(href)
  }

  function handleRevert() {
    update.mutate(
      { id: activity.id, patch: { status: 'wishlist' } },
      {
        onSuccess: () => toast.success(`${STATUS_LABELS.wishlist}으로 옮겼어요`),
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  function handleDelete() {
    // 낙관적 제거로 카드가 곧 언마운트되므로 다이얼로그를 먼저 닫는다.
    // 토스트/롤백은 훅(onSuccess/onError)에서 처리 — 언마운트 시 호출부 콜백은 실행되지 않음.
    setDeleteOpen(false)
    del.mutate(activity.id)
  }

  const isVisited = activity.status === 'visited'
  const TimeOfDayIcon = TIME_OF_DAY_ICONS[activity.time_of_day]
  const detailPath = `/activities/${activity.id}`
  // 정보 줄 우선순위: 메모 있으면 메모, 없으면 위치, 둘 다 없으면 빈 슬롯.
  // 아이콘으로 메모(StickyNote)/위치(MapPin) 구분.
  const infoText = activity.memo || activity.location
  const InfoIcon = activity.memo ? StickyNote : activity.location ? MapPin : null

  return (
    <div className={cn(styles.card, styles.cardInteractive, 'group relative')}>
      {!hideMenu && (
        <div
          className="absolute right-1.5 top-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ItemMenu
            status={activity.status}
            onEditInfo={() => navigate(buildDetailHref(detailPath, { edit: 'info', returnTo }))}
            onEditVisit={() => navigate(buildDetailHref(detailPath, { edit: 'visit', returnTo }))}
            onDuplicate={() => navigate(stashActivityDuplicate(activity))}
            onDelete={() => setDeleteOpen(true)}
            onMarkVisited={() => setVisitedOpen(true)}
            onRevert={handleRevert}
          />
        </div>
      )}

      <Link
        href={buildDetailHref(detailPath, { returnTo })}
        className={cn('block p-3.5', hideMenu ? 'pr-3.5' : 'pr-11')}
      >
        {activity.category && (
          <div className="mb-0.5">
            <CategoryBadge category={activity.category} />
          </div>
        )}

        <h3 className={cn('mb-3 line-clamp-1', styles.cardTitle)}>{activity.title}</h3>

        <div className={cn('mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs', styles.sub)}>
          {activity.duration_bucket && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3 shrink-0" />
              {DURATION_LABELS[activity.duration_bucket]}
            </span>
          )}
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            {TimeOfDayIcon && <TimeOfDayIcon className="h-3 w-3 shrink-0" />}
            {TIME_OF_DAY_LABELS[activity.time_of_day]}
          </span>
        </div>

        {/* 정보 줄: 항상 렌더(내용 없어도 min-h-5로 자리 유지) → 메모/위치 유무와 무관하게
            카드 높이·별점/날짜 줄 위치가 일정하다. 아이콘으로 메모/위치 구분.
            스타일은 배지(메타) 줄과 동일(text-xs + styles.sub) — 카드 위계 통일. */}
        <div className={cn('flex min-h-5 items-center gap-1 text-xs', styles.sub)}>
          {InfoIcon && <InfoIcon className="h-3 w-3 shrink-0" />}
          {infoText && <span className="line-clamp-1">{infoText}</span>}
        </div>

        {isVisited && (
          <div className={cn('mt-2.5 flex items-center gap-2 pt-2.5 text-xs', styles.divider, styles.sub)}>
            {activity.rating ? (
              <RatingStars value={activity.rating} size="sm" />
            ) : null}
            {activity.visited_at && (
              <span>{formatDotDateRange(activity.visited_at, activity.visited_end_at)}</span>
            )}
          </div>
        )}
      </Link>

      {actionSlot && <div className={cn('px-4 py-3', styles.divider)}>{actionSlot}</div>}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={activity.title}
        loading={del.isPending}
        onConfirm={handleDelete}
      />
      <VisitedDialog
        open={visitedOpen}
        onOpenChange={setVisitedOpen}
        track="activity"
        id={activity.id}
        title={activity.title}
        initial={{
          visited_at: activity.visited_at,
          visited_end_at: activity.visited_end_at,
          rating: activity.rating,
          review_note: activity.review_note,
        }}
      />
    </div>
  )
}
