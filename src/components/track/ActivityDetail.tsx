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
  ExternalLink,
  Calendar,
  User,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryBadge } from './CategoryBadge'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useActivity, useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export function ActivityDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: activity, isLoading, isError } = useActivity(id)
  const del = useDeleteActivity()
  const update = useUpdateActivity()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const [revertOpen, setRevertOpen] = useState(false)

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
      { id, patch: { status: 'wishlist', visited_at: null, rating: null, review_note: null } },
      {
        onSuccess: () => {
          setRevertOpen(false)
          toast.success('위시리스트로 옮겼어요')
        },
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  const labelCls = cn('mb-1.5 text-xs font-medium uppercase tracking-wide', styles.sub)

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
      {/* 백링크 */}
      <Link href="/list" className={styles.backLink}>
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {/* 로딩 */}
      {isLoading ? (
        <div className="mt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-8 w-3/4" />
          <div className="mt-5 space-y-px">
            {[14, 20, 32, 14].map((h, i) => (
              <div key={i} className="border-t border-[var(--s-divider,rgba(0,0,0,0.06))] py-4">
                <Skeleton className="mb-2 h-2.5 w-12" />
                <Skeleton className={`h-${h} w-full`} style={{ height: `${h * 4}px` }} />
              </div>
            ))}
          </div>
        </div>
      ) : isError || !activity ? (
        <div className={cn(styles.empty, 'mt-4', styles.sub)}>활동을 찾을 수 없어요.</div>
      ) : (
        <>
          {/* ── 페이지 타이틀 (카드 없음) ── */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              {activity.category && <CategoryBadge category={activity.category} />}
              {activity.status === 'visited' && (
                <span className={styles.visitedTag}>다녀온 곳</span>
              )}
            </div>
            <h1 className={cn('mt-2', styles.pageTitle)}>{activity.title}</h1>
          </div>

          {/* ── 정의형 시트 ── */}
          <div className="mt-5">

            {/* 카테고리 — 있을 때만 */}
            {activity.category && (
              <div className={styles.sheetRow}>
                <p className={labelCls}>카테고리</p>
                <p className={cn('text-sm', styles.ink)}>{activity.category.name}</p>
              </div>
            )}

            {/* 소요시간 — 있을 때만 */}
            {activity.duration_bucket && (
              <div className={styles.sheetRow}>
                <p className={labelCls}>소요시간</p>
                <p className={cn('text-sm', styles.ink)}>
                  {DURATION_LABELS[activity.duration_bucket]}
                </p>
              </div>
            )}

            {/* 시간대 — 'any'면 숨김 */}
            {activity.time_of_day && activity.time_of_day !== 'any' && (
              <div className={styles.sheetRow}>
                <p className={labelCls}>시간대</p>
                <p className={cn('text-sm', styles.ink)}>
                  {TIME_OF_DAY_LABELS[activity.time_of_day]}
                </p>
              </div>
            )}

            {/* 메모 — 항상 노출 */}
            <div className={styles.sheetRow}>
              <p className={labelCls}>메모</p>
              {activity.memo ? (
                <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', styles.ink)}>
                  {activity.memo}
                </p>
              ) : (
                <p className={cn('text-sm', styles.faint)}>아직 메모가 없어요</p>
              )}
            </div>

            {/* 참고 링크 — 항상 노출 */}
            <div className={styles.sheetRow}>
              <p className={labelCls}>참고 링크</p>
              {activity.reference_url ? (
                <a
                  href={activity.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-1.5 text-sm hover:underline',
                    styles.accent
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  참고 링크 열기
                </a>
              ) : (
                <p className={cn('text-sm', styles.faint)}>참고 링크가 없어요</p>
              )}
            </div>

            {/* 방문 기록 — visited일 때만 */}
            {activity.status === 'visited' && (
              <div className={styles.sheetRow}>
                <p className={labelCls}>방문 기록</p>
                <div className="space-y-2">
                  {activity.visited_at && (
                    <div className={cn('flex items-center gap-1.5 text-sm', styles.ink)}>
                      <Calendar className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
                      {activity.visited_at}
                    </div>
                  )}
                  {activity.rating ? (
                    <RatingStars value={activity.rating} size="sm" />
                  ) : null}
                  {activity.review_note && (
                    <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', styles.sub)}>
                      {activity.review_note}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 등록 정보 — 있을 때만 */}
            {(activity.added_by || activity.created_at) && (
              <div className={styles.sheetRow}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {activity.added_by && (
                    <span className={cn('inline-flex items-center gap-1 text-xs', styles.faint)}>
                      <User className="h-3 w-3 shrink-0" />
                      {activity.added_by}
                    </span>
                  )}
                  {activity.created_at && (
                    <span className={cn('text-xs', styles.faint)}>
                      {new Date(activity.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      에 등록
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── 액션 버튼 ── */}
          <div className="mt-6 flex flex-wrap gap-2">
            {activity.status === 'visited' ? (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setVisitedOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  기록 수정
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setRevertOpen(true)}
                >
                  <Undo2 className="h-4 w-4" />
                  위시리스트로 되돌리기
                </Button>
              </>
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

          {/* ── 다이얼로그 ── */}
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
          <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
            <DialogContent className="max-w-xs">
              <DialogHeader>
                <DialogTitle>위시리스트로 되돌릴까요?</DialogTitle>
                <DialogDescription>
                  별점, 감상, 방문일이 모두 삭제됩니다. 되돌릴 수 없어요.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" disabled={update.isPending} />}>
                  취소
                </DialogClose>
                <Button onClick={handleRevert} disabled={update.isPending}>
                  {update.isPending ? '처리 중...' : '되돌리기'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
