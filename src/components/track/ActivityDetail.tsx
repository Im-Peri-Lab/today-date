'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { CategorySelect } from '@/components/CategorySelect'
import { useActivity, useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { activityFormSchema, type ActivityFormValues } from '@/lib/schemas/activitySchema'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

const DURATION_OPTIONS = [
  { value: 'half' as const, label: '반나절' },
  { value: 'full' as const, label: '하루' },
  { value: 'overnight' as const, label: '1박 이상' },
]

const TIME_OPTIONS = [
  { value: 'day' as const, label: '주간' },
  { value: 'night' as const, label: '야간' },
  { value: 'any' as const, label: '상관없음' },
]

export function ActivityDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: activity, isLoading, isError } = useActivity(id)
  const del = useDeleteActivity()
  const update = useUpdateActivity()

  const [mode, setMode] = useState<'view' | 'edit'>('view')
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

  const durationValue = watch('duration_bucket')
  const timeValue = watch('time_of_day')
  const categoryValue = watch('category_id') ?? ''

  /* ── 핸들러 ── */

  function handleDelete() {
    del.mutate(id, {
      onSuccess: () => { toast.success('삭제했어요'); router.push('/list') },
      onError: () => toast.error('삭제 중 오류가 발생했습니다.'),
    })
  }

  function handleRevert() {
    update.mutate(
      { id, patch: { status: 'wishlist', visited_at: null, rating: null, review_note: null } },
      {
        onSuccess: () => { setRevertOpen(false); toast.success('위시리스트로 옮겼어요') },
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  function handleStartEdit() {
    if (!activity) return
    reset({
      title: activity.title,
      category_id: activity.category_id ?? '',
      duration_bucket: activity.duration_bucket ?? undefined,
      time_of_day: activity.time_of_day,
      memo: activity.memo ?? '',
      reference_url: activity.reference_url ?? '',
    })
    setMode('edit')
  }

  function handleCancel() {
    setMode('view')
  }

  const onSave = handleSubmit(async (values) => {
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
      setMode('view')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    }
  })

  const labelCls = cn('mb-1.5 text-xs font-medium uppercase tracking-wide', styles.sub)

  /* ── 렌더 ── */

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
            {([56, 14, 56, 14] as number[]).map((h, i) => (
              <div key={i} className="border-t border-[var(--s-divider,rgba(0,0,0,0.06))] py-4">
                <Skeleton className="mb-2 h-2.5 w-12" />
                <Skeleton style={{ height: `${h}px` }} className="w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : isError || !activity ? (
        <div className={cn(styles.empty, 'mt-4', styles.sub)}>활동을 찾을 수 없어요.</div>
      ) : (
        <>
          {/* ══════════════════════════════════
              기본 정보 영역
          ══════════════════════════════════ */}
          <section className="mt-4">

            {/* 제목 행 + 수정 버튼 */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {activity.category && <CategoryBadge category={activity.category} />}
                  {activity.status === 'visited' && (
                    <span className={styles.visitedTag}>다녀온 곳</span>
                  )}
                </div>
                {mode === 'view' && (
                  <h1 className={cn('mt-2', styles.pageTitle)}>{activity.title}</h1>
                )}
              </div>
              {mode === 'view' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 shrink-0 gap-1.5"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  수정
                </Button>
              )}
            </div>

            {/* 보기 모드 — 정의형 시트 */}
            {mode === 'view' && (
              <div className="mt-3">
                {activity.duration_bucket && (
                  <div className={styles.sheetRow}>
                    <p className={labelCls}>소요시간</p>
                    <p className={cn('text-sm', styles.ink)}>
                      {DURATION_LABELS[activity.duration_bucket]}
                    </p>
                  </div>
                )}
                {activity.time_of_day && activity.time_of_day !== 'any' && (
                  <div className={styles.sheetRow}>
                    <p className={labelCls}>시간대</p>
                    <p className={cn('text-sm', styles.ink)}>
                      {TIME_OF_DAY_LABELS[activity.time_of_day]}
                    </p>
                  </div>
                )}
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
              </div>
            )}

            {/* 편집 모드 — 인라인 폼 */}
            {mode === 'edit' && (
              <form
                onSubmit={onSave}
                className={cn(
                  'mt-4 space-y-5 border-t pt-5',
                  'border-[var(--s-divider,rgba(0,0,0,0.06))]'
                )}
              >
                {/* 제목 */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>
                    제목 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="활동 이름을 입력해 주세요"
                    {...register('title')}
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* 카테고리 */}
                <div className="space-y-1.5">
                  <Label className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>
                    카테고리
                  </Label>
                  <CategorySelect
                    track="activity"
                    value={categoryValue}
                    onChange={(v) => setValue('category_id', v)}
                    error={errors.category_id?.message}
                  />
                </div>

                {/* 소요시간 */}
                <div className="space-y-2">
                  <Label className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>
                    소요시간 <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          styles.editRadioOption,
                          durationValue === opt.value && styles.editRadioOptionActive
                        )}
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          {...register('duration_bucket')}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {errors.duration_bucket && (
                    <p className="text-xs text-destructive">{errors.duration_bucket.message}</p>
                  )}
                </div>

                {/* 시간대 */}
                <div className="space-y-2">
                  <Label className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>
                    시간대
                  </Label>
                  <div className="flex gap-2">
                    {TIME_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          styles.editRadioOption,
                          timeValue === opt.value && styles.editRadioOptionActive
                        )}
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          {...register('time_of_day')}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 메모 */}
                <div className="space-y-1.5">
                  <Label htmlFor="memo" className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>
                    메모
                  </Label>
                  <Textarea
                    id="memo"
                    placeholder="활동에 대한 메모를 남겨보세요"
                    rows={3}
                    {...register('memo')}
                    aria-invalid={!!errors.memo}
                  />
                  {errors.memo && (
                    <p className="text-xs text-destructive">{errors.memo.message}</p>
                  )}
                </div>

                {/* 참고 링크 */}
                <div className="space-y-1.5">
                  <Label htmlFor="reference_url" className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>
                    참고 링크
                  </Label>
                  <Input
                    id="reference_url"
                    type="url"
                    placeholder="https://..."
                    {...register('reference_url')}
                    aria-invalid={!!errors.reference_url}
                  />
                  {errors.reference_url && (
                    <p className="text-xs text-destructive">{errors.reference_url.message}</p>
                  )}
                </div>

                {/* 저장 / 취소 */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-1.5 text-white hover:brightness-105"
                    style={{
                      background:
                        'var(--s-active-fill, linear-gradient(135deg,#a855f7 0%,#ec4899 100%))',
                    }}
                  >
                    {isSubmitting ? '저장 중...' : '저장'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleCancel}
                  >
                    취소
                  </Button>
                </div>
              </form>
            )}
          </section>

          {/* ══════════════════════════════════
              방문 기록 영역 (보기 전용, visited만)
          ══════════════════════════════════ */}
          {activity.status === 'visited' && (
            <div className="mt-6">
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
            </div>
          )}

          {/* ── 등록 정보 ── */}
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

          {/* ── 하단 액션 버튼 ── */}
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
