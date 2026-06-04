'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  ExternalLink,
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
import { ActivityFields } from './ActivityFields'
import { DetailBlock } from './DetailBlock'
import { DetailRow } from './DetailRow'
import { VisitRecordBlock } from './VisitRecordBlock'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useActivity, useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { activityFormSchema, type ActivityFormValues } from '@/lib/schemas/activitySchema'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface Props {
  id: string
  initialMode?: 'view' | 'edit'
}

export function ActivityDetail({ id, initialMode = 'view' }: Props) {
  const router = useRouter()
  const { data: activity, isLoading, isError } = useActivity(id)
  const del = useDeleteActivity()
  const update = useUpdateActivity()

  const [editingInfo, setEditingInfo] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const [revertOpen, setRevertOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: { title: '', time_of_day: 'any', memo: '', reference_url: '', category_id: '' },
  })

  function fillForm() {
    if (!activity) return
    reset({
      title: activity.title,
      category_id: activity.category_id ?? '',
      duration_bucket: activity.duration_bucket ?? undefined,
      time_of_day: activity.time_of_day,
      memo: activity.memo ?? '',
      reference_url: activity.reference_url ?? '',
    })
  }

  // initialMode='edit'(?mode=edit)일 때 activity 로드 후 등록 정보 블록을 편집 모드로 연다.
  const didInitEdit = useRef(false)
  useEffect(() => {
    if (didInitEdit.current || !activity || initialMode !== 'edit') return
    didInitEdit.current = true
    fillForm()
    setEditingInfo(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id, initialMode])

  /* ── 핸들러 ── */

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

  function startEditInfo() {
    fillForm()
    setEditingInfo(true)
  }

  function exitEditInfo() {
    setEditingInfo(false)
    // URL에서 ?mode=edit 제거 (재내비게이션 없이 히스토리만 교체)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/activities/${id}`)
    }
  }

  const onSaveInfo = handleSubmit(async (values) => {
    if (!activity) return
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      memo: values.memo || null,
      added_by: values.added_by || null,
    }
    try {
      await update.mutateAsync({ id: activity.id, patch: payload })
      toast.success('수정되었습니다!')
      exitEditInfo()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    }
  })

  /* ── 렌더 ── */

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
      <Link href="/list" className={styles.backLink}>
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className={cn(styles.card, 'h-40 w-full')} />
          <Skeleton className={cn(styles.card, 'h-28 w-full')} />
        </div>
      ) : isError || !activity ? (
        <div className={cn(styles.empty, 'mt-4', styles.sub)}>활동을 찾을 수 없어요.</div>
      ) : (
        <>
          {/* 제목 영역 — 편집 중에는 폼 안에 제목 입력이 있으므로 숨김 */}
          {!editingInfo && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                {activity.category && <CategoryBadge category={activity.category} />}
                {activity.status === 'visited' && (
                  <span className={styles.visitedTag}>다녀온 곳</span>
                )}
              </div>
              <h1 className={cn('mt-2', styles.pageTitle)}>{activity.title}</h1>
            </div>
          )}

          <div className="mt-5 space-y-4">
            {/* ── 등록 정보 블록 ── */}
            <DetailBlock
              title="등록 정보"
              editing={editingInfo}
              onEdit={startEditInfo}
              onCancel={exitEditInfo}
              onSave={onSaveInfo}
              saving={isSubmitting || update.isPending}
            >
              {editingInfo ? (
                <ActivityFields
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              ) : (
                <div>
                  {activity.duration_bucket && (
                    <DetailRow label="소요시간">
                      {DURATION_LABELS[activity.duration_bucket]}
                    </DetailRow>
                  )}
                  {activity.time_of_day && activity.time_of_day !== 'any' && (
                    <DetailRow label="시간대">
                      {TIME_OF_DAY_LABELS[activity.time_of_day]}
                    </DetailRow>
                  )}
                  <DetailRow label="메모">
                    {activity.memo ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{activity.memo}</p>
                    ) : (
                      <span className={styles.faint}>아직 메모가 없어요</span>
                    )}
                  </DetailRow>
                  <DetailRow label="참고 링크">
                    {activity.reference_url ? (
                      <a
                        href={activity.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn('inline-flex items-center gap-1.5 hover:underline', styles.accent)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        참고 링크 열기
                      </a>
                    ) : (
                      <span className={styles.faint}>참고 링크가 없어요</span>
                    )}
                  </DetailRow>
                </div>
              )}
            </DetailBlock>

            {/* ── 방문 기록 블록 (미방문이면 렌더 안 함) ── */}
            {activity.status === 'visited' && (
              <VisitRecordBlock
                track="activity"
                id={id}
                visitedAt={activity.visited_at}
                rating={activity.rating}
                reviewNote={activity.review_note}
              />
            )}
          </div>

          {/* ── 등록 메타 (누가/언제 등록) ── */}
          {(activity.added_by || activity.created_at) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
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
          )}

          {/* ── 하단 액션 버튼 (버튼 위계 정리는 다음 단계 — 이번엔 유지) ── */}
          {!editingInfo && (
            <div className="mt-6 flex flex-wrap gap-2">
              {activity.status === 'visited' ? (
                <Button variant="outline" className="gap-1.5" onClick={() => setRevertOpen(true)}>
                  <Undo2 className="h-4 w-4" />
                  위시리스트로 되돌리기
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
              <Button variant="destructive" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </div>
          )}

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
