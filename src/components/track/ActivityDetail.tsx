'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Undo2,
  Clock,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBadge } from './CategoryBadge'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useActivity, useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'

export function ActivityDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: activity, isLoading, isError } = useActivity(id)
  const del = useDeleteActivity()
  const update = useUpdateActivity()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)

  function handleDelete() {
    del.mutate(id, {
      onSuccess: () => {
        toast.success('삭제했어요')
        router.push('/list')
      },
      onError: () => toast.error('삭제 중 오류가 발생했습니다.'),
    })
  }

  function handleRevert() {
    update.mutate(
      { id, patch: { status: 'wishlist' } },
      {
        onSuccess: () => toast.success('위시리스트로 옮겼어요'),
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link
        href="/list"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {isLoading ? (
        <Card className="shadow-xl border-violet-100">
          <CardHeader>
            <Skeleton className="h-7 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : isError || !activity ? (
        <div className="rounded-xl border border-dashed border-violet-200 bg-white/50 p-10 text-center text-gray-500">
          활동을 찾을 수 없어요.
        </div>
      ) : (
        <>
          <Card className="shadow-xl border-violet-100">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                {activity.category && <CategoryBadge category={activity.category} />}
                {activity.status === 'visited' && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    다녀온 곳
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-bold text-violet-900">{activity.title}</h1>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {activity.duration_bucket && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {DURATION_LABELS[activity.duration_bucket]}
                  </span>
                )}
                {activity.time_of_day && (
                  <span className="inline-flex items-center gap-1.5">
                    {activity.time_of_day === 'night' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    {TIME_OF_DAY_LABELS[activity.time_of_day]}
                  </span>
                )}
              </div>

              {activity.memo && (
                <p className="whitespace-pre-wrap text-sm text-foreground">{activity.memo}</p>
              )}

              {activity.reference_url && (
                <a
                  href={activity.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  참고 링크
                </a>
              )}

              {activity.status === 'visited' && (
                <div className="space-y-2 rounded-lg bg-violet-50/60 p-3">
                  {activity.visited_at && (
                    <p className="text-sm text-violet-800">방문일: {activity.visited_at}</p>
                  )}
                  {activity.rating ? <RatingStars value={activity.rating} size="sm" /> : null}
                  {activity.review_note && (
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {activity.review_note}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/activities/${id}/edit`}>
              <Button variant="outline" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                수정
              </Button>
            </Link>
            {activity.status === 'visited' ? (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setVisitedOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  방문 정보 수정
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={handleRevert}>
                  <Undo2 className="h-4 w-4" />
                  위시리스트로
                </Button>
              </>
            ) : (
              <Button
                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => setVisitedOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                다녀왔어요
              </Button>
            )}
            <Button variant="destructive" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          </div>

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
            id={id}
            title={activity.title}
            initial={{
              visited_at: activity.visited_at,
              rating: activity.rating,
              review_note: activity.review_note,
            }}
          />
        </>
      )}
    </div>
  )
}
