'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { ItemMenu } from './ItemMenu'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useDeletePlace, useUpdatePlace } from '@/hooks/usePlaces'
import { MEAL_LABELS } from '@/lib/labels'
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
        onSuccess: () => toast.success('위시리스트로 옮겼어요'),
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
        <div className="absolute right-1.5 top-1.5 z-10">
          <ItemMenu
            status={place.status}
            onEdit={() => router.push(`/places/${place.id}/edit`)}
            onDelete={() => setDeleteOpen(true)}
            onMarkVisited={() => setVisitedOpen(true)}
            onRevert={handleRevert}
          />
        </div>
      )}

      <Link href={`/places/${place.id}`} className={cn('block p-4', hideMenu ? 'pr-4' : 'pr-11')}>
        {place.category && (
          <div className="mb-2">
            <CategoryBadge category={place.category} />
          </div>
        )}

        <h3 className={cn('mb-1.5 line-clamp-1', styles.cardTitle)}>{place.title}</h3>

        <div className={cn('mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs', styles.sub)}>
          {place.location && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3 shrink-0" />
              {place.location}
            </span>
          )}
          {place.meal_times?.map((m) => (
            <span key={m} className={styles.mealBadge}>
              {MEAL_LABELS[m]}
            </span>
          ))}
        </div>

        {place.memo && (
          <p className={cn('line-clamp-2 text-[13px] leading-relaxed', styles.sub)}>{place.memo}</p>
        )}

        {isVisited && (
          <div className={cn('mt-2.5 flex items-center gap-2 pt-2.5 text-xs', styles.divider, styles.sub)}>
            {place.rating ? <RatingStars value={place.rating} size="sm" /> : null}
            {place.visited_at && <span>{place.visited_at}</span>}
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
