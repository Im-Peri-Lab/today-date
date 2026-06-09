'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { MapPin, Utensils } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { ItemMenu } from './ItemMenu'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useDeletePlace, useUpdatePlace } from '@/hooks/usePlaces'
import { MEAL_LABELS, STATUS_LABELS } from '@/lib/labels'
import { formatDotDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Place } from '@/types'
import styles from '@/components/screens.module.css'

interface PlaceCardProps {
  place: Place
  hideMenu?: boolean
  actionSlot?: ReactNode
}

export function PlaceCard({ place, hideMenu, actionSlot }: PlaceCardProps) {
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
    del.mutate(place.id, {
      onSuccess: () => {
        toast.success('삭제했어요')
        setDeleteOpen(false)
      },
      onError: () => toast.error('삭제 중 오류가 발생했습니다.'),
    })
  }

  const isVisited = place.status === 'visited'

  return (
    <div className={cn(styles.card, styles.cardInteractive, 'group relative')}>
      {!hideMenu && (
        <div
          className="absolute right-1.5 top-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ItemMenu
            status={place.status}
            onEditInfo={() => router.push(`/places/${place.id}?edit=info`)}
            onEditVisit={() => router.push(`/places/${place.id}?edit=visit`)}
            onDelete={() => setDeleteOpen(true)}
            onMarkVisited={() => setVisitedOpen(true)}
            onRevert={handleRevert}
          />
        </div>
      )}

      <Link href={`/places/${place.id}`} className={cn('block p-3.5', hideMenu ? 'pr-3.5' : 'pr-11')}>
        {place.category && (
          <div className="mb-0.5">
            <CategoryBadge category={place.category} />
          </div>
        )}

        <h3 className={cn('mb-3 line-clamp-1 text-lg font-semibold', styles.ink)}>{place.title}</h3>

        <div className={cn('mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs', styles.sub)}>
          {place.location && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3 shrink-0" />
              {place.location}
            </span>
          )}
          {place.meal_times && place.meal_times.length > 0 && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Utensils className="h-3 w-3 shrink-0" />
              {place.meal_times.map((m) => MEAL_LABELS[m]).join(', ')}
            </span>
          )}
        </div>

        {place.memo && (
          <p className={cn('line-clamp-1 text-sm', styles.faint)}>{place.memo}</p>
        )}

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
