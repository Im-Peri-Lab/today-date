'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { MapPin, Utensils, StickyNote } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { ItemMenu } from './ItemMenu'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useDeletePlace, useUpdatePlace } from '@/hooks/usePlaces'
import { MEAL_LABELS, STATUS_LABELS } from '@/lib/labels'
import { buildDetailHref } from '@/lib/listReturn'
import { stashPlaceDuplicate } from '@/lib/duplicatePrefill'
import { formatDotDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Place } from '@/types'
import styles from '@/components/screens.module.css'

interface PlaceCardProps {
  place: Place
  hideMenu?: boolean
  actionSlot?: ReactNode
  returnTo?: string
}

export function PlaceCard({ place, hideMenu, actionSlot, returnTo }: PlaceCardProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const del = useDeletePlace()
  const update = useUpdatePlace()

  function handleRevert() {
    update.mutate(
      { id: place.id, patch: { status: 'wishlist' } },
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
    del.mutate(place.id)
  }

  const isVisited = place.status === 'visited'
  const detailPath = `/places/${place.id}`

  return (
    <div className={cn(styles.card, styles.cardInteractive, 'group relative')}>
      {!hideMenu && (
        <div
          className="absolute right-1.5 top-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ItemMenu
            status={place.status}
            onEditInfo={() => router.push(buildDetailHref(detailPath, { edit: 'info', returnTo }))}
            onEditVisit={() => router.push(buildDetailHref(detailPath, { edit: 'visit', returnTo }))}
            onDuplicate={() => router.push(stashPlaceDuplicate(place))}
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
        {place.category && (
          <div className="mb-0.5">
            <CategoryBadge category={place.category} />
          </div>
        )}

        <h3 className={cn('mb-3 line-clamp-1', styles.cardTitle)}>{place.title}</h3>

        <div className={cn('mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs', styles.sub)}>
          {place.area && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3 shrink-0" />
              {place.area}
            </span>
          )}
          {place.meal_times && place.meal_times.length > 0 && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Utensils className="h-3 w-3 shrink-0" />
              {place.meal_times.map((m) => MEAL_LABELS[m]).join(', ')}
            </span>
          )}
        </div>

        {/* 정보 줄: ActivityCard와 동일한 고정 높이 컨테이너(항상 렌더). 장소는 메모만 표시.
            내용 없어도 min-h-5로 자리 유지 → 메모 유무와 무관하게 카드 높이 일정.
            스타일은 배지(메타) 줄과 동일(text-xs + styles.sub) — 카드 위계 통일. */}
        <div className={cn('flex min-h-5 items-center gap-1 text-xs', styles.sub)}>
          {place.memo && <StickyNote className="h-3 w-3 shrink-0" />}
          {place.memo && <span className="line-clamp-1">{place.memo}</span>}
        </div>

        {isVisited && (
          <div className={cn('mt-2.5 flex items-center gap-2 pt-2.5 text-xs', styles.divider, styles.sub)}>
            {place.rating ? <RatingStars value={place.rating} size="sm" /> : null}
            {place.visited_at && <span>{formatDotDate(place.visited_at)}</span>}
          </div>
        )}
      </Link>

      {actionSlot && <div className={cn('px-4 py-3', styles.divider)}>{actionSlot}</div>}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={place.title}
        loading={del.isPending}
        onConfirm={handleDelete}
      />
      <VisitedDialog
        open={visitedOpen}
        onOpenChange={setVisitedOpen}
        track="place"
        id={place.id}
        title={place.title}
        initial={{
          visited_at: place.visited_at,
          rating: place.rating,
          review_note: place.review_note,
        }}
      />
    </div>
  )
}
