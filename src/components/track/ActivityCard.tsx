'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Clock, Sun, Moon } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { ItemMenu } from './ItemMenu'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Activity } from '@/types'
import styles from '@/components/screens.module.css'

interface ActivityCardProps {
  activity: Activity
  hideMenu?: boolean
  actionSlot?: ReactNode
}

export function ActivityCard({ activity, hideMenu, actionSlot }: ActivityCardProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const del = useDeleteActivity()
  const update = useUpdateActivity()

  function handleRevert() {
    update.mutate(
      { id: activity.id, patch: { status: 'wishlist' } },
      {
        onSuccess: () => toast.success('위시리스트로 옮겼어요'),
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  function handleDelete() {
    del.mutate(activity.id, {
      onSuccess: () => {
        toast.success('삭제했어요')
        setDeleteOpen(false)
      },
      onError: () => toast.error('삭제 중 오류가 발생했습니다.'),
    })
  }

  const isVisited = activity.status === 'visited'

  return (
    <div className={cn(styles.card, styles.cardInteractive, 'group relative')}>
      {!hideMenu && (
        <div
          className="absolute right-1.5 top-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ItemMenu
            status={activity.status}
            onEdit={() => router.push(`/activities/${activity.id}/edit`)}
            onDelete={() => setDeleteOpen(true)}
            onMarkVisited={() => setVisitedOpen(true)}
            onRevert={handleRevert}
          />
        </div>
      )}

      <Link
        href={`/activities/${activity.id}`}
        className={cn('block p-3.5', hideMenu ? 'pr-3.5' : 'pr-11')}
      >
        {activity.category && (
          <div className="mb-2">
            <CategoryBadge category={activity.category} />
          </div>
        )}

        <h3 className={cn('mb-1 line-clamp-1 text-lg font-semibold', styles.ink)}>{activity.title}</h3>

        <div className={cn('mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs', styles.sub)}>
          {activity.duration_bucket && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3 shrink-0" />
              {DURATION_LABELS[activity.duration_bucket]}
            </span>
          )}
          {activity.time_of_day && activity.time_of_day !== 'any' && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              {activity.time_of_day === 'day' ? (
                <Sun className="h-3 w-3 shrink-0" />
              ) : (
                <Moon className="h-3 w-3 shrink-0" />
              )}
              {TIME_OF_DAY_LABELS[activity.time_of_day]}
            </span>
          )}
        </div>

        {activity.memo && (
          <p className={cn('line-clamp-1 text-sm', styles.faint)}>{activity.memo}</p>
        )}

        {isVisited && (
          <div className={cn('mt-2.5 flex items-center gap-2 pt-2.5 text-xs', styles.divider, styles.sub)}>
            {activity.rating ? (
              <RatingStars value={activity.rating} size="sm" />
            ) : null}
            {activity.visited_at && <span>{activity.visited_at}</span>}
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
          rating: activity.rating,
          review_note: activity.review_note,
        }}
      />
    </div>
  )
}
