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
  Clock,
  Sun,
  Moon,
  ExternalLink,
  Calendar,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBadge } from './CategoryBadge'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useActivity, useDeleteActivity } from '@/hooks/useActivities'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export function ActivityDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: activity, isLoading, isError } = useActivity(id)
  const del = useDeleteActivity()
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

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
      {/* 백링크 */}
      <Link href="/list" className={styles.backLink}>
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {/* 로딩 */}
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <div className={cn(styles.card, 'p-5')}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-7 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/3" />
          </div>
          <div className={cn(styles.card, 'p-5')}>
            <Skeleton className="mb-2 h-3 w-10" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : isError || !activity ? (
        <div className={cn(styles.empty, 'mt-4', styles.sub)}>활동을 찾을 수 없어요.</div>
      ) : (
        <div className="mt-4 space-y-3">

          {/* ── 헤더: 카테고리 · 제목 · 메타 ── */}
          <div className={cn(styles.card, 'p-5 lg:p-6')}>
            <div className="flex flex-wrap items-center gap-2">
              {activity.category && <CategoryBadge category={activity.category} />}
              {activity.status === 'visited' && (
                <span className={styles.visitedTag}>다녀온 곳</span>
              )}
            </div>

            <h1 className={cn('mt-2 text-2xl font-bold leading-snug lg:text-3xl', styles.ink)}>
              {activity.title}
            </h1>

            {(activity.duration_bucket ||
              (activity.time_of_day && activity.time_of_day !== 'any')) && (
              <div
                className={cn(
                  'mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm',
                  styles.sub
                )}
              >
                {activity.duration_bucket && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {DURATION_LABELS[activity.duration_bucket]}
                  </span>
                )}
                {activity.time_of_day && activity.time_of_day !== 'any' && (
                  <span className="inline-flex items-center gap-1.5">
                    {activity.time_of_day === 'night' ? (
                      <Moon className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {TIME_OF_DAY_LABELS[activity.time_of_day]}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── 메모 (있을 때만) ── */}
          {activity.memo && (
            <div className={cn(styles.card, 'p-5 lg:p-6')}>
              <p className={cn('mb-2.5 text-xs font-medium uppercase tracking-wide', styles.faint)}>
                메모
              </p>
              <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', styles.ink)}>
                {activity.memo}
              </p>
            </div>
          )}

          {/* ── 참고 링크 (있을 때만) ── */}
          {activity.reference_url && (
            <div className={cn(styles.card, 'p-5')}>
              <a
                href={activity.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 text-sm font-medium hover:underline',
                  styles.accent
                )}
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                참고 링크 열기
              </a>
            </div>
          )}

          {/* ── 방문 기록 (visited일 때만) ── */}
          {activity.status === 'visited' && (
            <div className={cn(styles.card, 'p-5 lg:p-6')}>
              <p className={cn('mb-3 text-xs font-medium uppercase tracking-wide', styles.faint)}>
                방문 기록
              </p>
              <div className="space-y-2.5">
                {activity.visited_at && (
                  <div className={cn('flex items-center gap-2 text-sm', styles.ink)}>
                    <Calendar className={cn('h-4 w-4 shrink-0', styles.faint)} />
                    {activity.visited_at}
                  </div>
                )}
                {activity.rating ? <RatingStars value={activity.rating} size="sm" /> : null}
                {activity.review_note && (
                  <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', styles.sub)}>
                    {activity.review_note}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── 등록 정보 ── */}
          {(activity.added_by || activity.created_at) && (
            <div
              className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs',
                styles.faint
              )}
            >
              {activity.added_by && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3 shrink-0" />
                  {activity.added_by}
                </span>
              )}
              {activity.created_at && (
                <span>
                  {new Date(activity.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  에 등록
                </span>
              )}
            </div>
          )}

          {/* ── 액션 버튼 ── */}
          <div className="flex flex-wrap gap-2 pt-1">
            {activity.status === 'visited' ? (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setVisitedOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                기록 수정
              </Button>
            ) : (
              <Button
                className="gap-1.5 text-white hover:brightness-105"
                style={{
                  background:
                    'var(--s-active-fill, linear-gradient(135deg,#a855f7 0%,#ec4899 100%))',
                }}
                onClick={() => setVisitedOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                다녀왔어요
              </Button>
            )}
            <Link href={`/activities/${id}/edit`}>
              <Button variant="outline" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                수정
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={() => setDeleteOpen(true)}
            >
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
        </div>
      )}
    </div>
  )
}
