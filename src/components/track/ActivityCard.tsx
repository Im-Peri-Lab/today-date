'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Clock, Sun, Moon } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { ItemMenu } from './ItemMenu'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import type { Activity } from '@/types'

export function ActivityCard({ activity }: { activity: Activity }) {
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
    <div className="group relative rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <div className="absolute right-1.5 top-1.5 z-10">
        <ItemMenu
          status={activity.status}
          onEdit={() => router.push(`/activities/${activity.id}/edit`)}
          onDelete={() => setDeleteOpen(true)}
          onMarkVisited={() => setVisitedOpen(true)}
          onRevert={handleRevert}
        />
      </div>

      <Link href={`/activities/${activity.id}`} className="block p-4 pr-11">
        <h3 className="mb-2 line-clamp-1 font-medium text-foreground">{activity.title}</h3>

        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {activity.category && <CategoryBadge category={activity.category} />}
          {activity.duration_bucket && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {DURATION_LABELS[activity.duration_bucket]}
            </span>
          )}
          {activity.time_of_day && activity.time_of_day !== 'any' && (
            <span className="inline-flex items-center gap-1">
              {activity.time_of_day === 'day' ? (
                <Sun className="h-3 w-3" />
              ) : (
                <Moon className="h-3 w-3" />
              )}
              {TIME_OF_DAY_LABELS[activity.time_of_day]}
            </span>
          )}
        </div>

        {activity.memo && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{activity.memo}</p>
        )}

        {isVisited && (
          <div className="mt-2 flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
            {activity.rating ? (
              <RatingStars value={activity.rating} size="sm" />
            ) : null}
            {activity.visited_at && <span>{activity.visited_at}</span>}
          </div>
        )}
      </Link>

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
