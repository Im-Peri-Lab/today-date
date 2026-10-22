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
import { RevertConfirmDialog } from './RevertConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import {
  DURATION_LABELS,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ICONS,
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_ICONS,
  STATUS_LABELS,
} from '@/lib/labels'
import { buildDetailHref } from '@/lib/listReturn'
import { stashActivityDuplicate } from '@/lib/duplicatePrefill'
import { formatDotDateCompact, formatDotDateRangeCompact } from '@/lib/date'
import { REVERT_TO_WISHLIST_PATCH } from '@/lib/revertPatch'
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
  const [revertOpen, setRevertOpen] = useState(false)
  const del = useDeleteActivity()
  const update = useUpdateActivity()

  // 카드 ⋮ 메뉴발 화면 이동: router.push 는 프로그레스 바가 자동으로 뜨지 않아
  // 등록/삭제 경로와 동일하게 push 직전 topLoader.start()로 진행 표시를 맞춘다.
  // 대상이 라우터 캐시에 있으면 push 가 즉시 커밋돼 바가 페인트 전에 끝나므로(pushState 시점에
  // done) start() 한 프레임 뒤에 push 한다.
  function navigate(href: string) {
    topLoader.start()
    requestAnimationFrame(() => router.push(href))
  }

  function handleRevert() {
    update.mutate(
      { id: activity.id, patch: REVERT_TO_WISHLIST_PATCH },
      {
        onSuccess: () => {
          setRevertOpen(false)
          toast.success(`${STATUS_LABELS.wishlist}으로 옮겼어요`)
        },
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
  const LocationTypeIcon = LOCATION_TYPE_ICONS[activity.location_type]
  const detailPath = `/activities/${activity.id}`
  // 정보 줄 우선순위: 메모 있으면 메모, 없으면 위치, 둘 다 없으면 빈 슬롯.
  // 아이콘으로 메모(StickyNote)/위치(MapPin) 구분.
  const infoText = activity.memo || activity.location
  const InfoIcon = activity.memo ? StickyNote : activity.location ? MapPin : null

  return (
    <div className={cn(styles.card, styles.cardInteractive, 'group relative')}>
      {!hideMenu && (
        <div
          className="absolute right-2.5 top-2.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ItemMenu
            status={activity.status}
            onEditInfo={() => navigate(buildDetailHref(detailPath, { edit: 'info', returnTo }))}
            onEditVisit={() => navigate(buildDetailHref(detailPath, { edit: 'visit', returnTo }))}
            onDuplicate={() => navigate(stashActivityDuplicate(activity, returnTo))}
            onDelete={() => setDeleteOpen(true)}
            onMarkVisited={() => setVisitedOpen(true)}
            onRevert={() => setRevertOpen(true)}
          />
        </div>
      )}

      {/* ⋮ 메뉴(우상단 absolute)는 카테고리·제목 줄과만 겹치므로 그 두 줄에만 pr-8.
          메타·정보 줄과 별점/후기 구분선은 카드 오른쪽 패딩까지 꽉 채운다. */}
      <Link
        href={buildDetailHref(detailPath, { returnTo })}
        className="block p-3.5"
      >
        {activity.category && (
          <div className={cn('mb-0.5', !hideMenu && 'pr-8')}>
            <CategoryBadge category={activity.category} />
          </div>
        )}

        <h3 className={cn('mb-3 line-clamp-1', !hideMenu && 'pr-8', styles.cardTitle)}>{activity.title}</h3>

        <div className={cn('mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs', styles.sub)}>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <LocationTypeIcon className="h-3 w-3 shrink-0" />
            {LOCATION_TYPE_LABELS[activity.location_type]}
          </span>
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
            스타일은 배지(메타) 줄과 동일(text-xs + styles.sub) — 카드 위계 통일.
            위시리스트에서 메모·위치가 모두 없으면 같은 한 줄 슬롯에 faint 안내 문구를 둔다(높이 동일). */}
        <div className={cn('flex min-h-5 items-center gap-1 text-xs', styles.sub)}>
          {InfoIcon && <InfoIcon className="h-3 w-3 shrink-0" />}
          {infoText ? (
            <span className="line-clamp-1">{infoText}</span>
          ) : !isVisited ? (
            <span className={cn('line-clamp-1', styles.emptyHint)}>위치 또는 메모가 없습니다</span>
          ) : null}
        </div>

        {isVisited && (
          <div className={cn('mt-2.5 pt-2.5 text-xs', styles.divider, styles.sub)}>
            <div className="flex items-center gap-2">
              {activity.rating ? <RatingStars value={activity.rating} size="sm" /> : null}
              {activity.visited_at && (
                <span>
                  {activity.visited_end_at
                    ? formatDotDateRangeCompact(activity.visited_at, activity.visited_end_at)
                    : formatDotDateCompact(activity.visited_at)}
                </span>
              )}
            </div>
            {/* 후기 한 줄 미리보기: 정보 줄(메모)과 같은 text-xs + line-clamp-1. 후기 유무와 무관하게
                min-h-4(text-xs 줄 높이 16px) 슬롯을 항상 유지해 카드 높이를 고정하고, 없으면 faint 안내 문구. */}
            <p className={cn('mt-1.5 min-h-4 line-clamp-1', !activity.review_note && styles.emptyHint)}>
              {activity.review_note || '후기가 없습니다'}
            </p>
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
      <RevertConfirmDialog
        open={revertOpen}
        onOpenChange={setRevertOpen}
        loading={update.isPending}
        onConfirm={handleRevert}
      />
    </div>
  )
}
