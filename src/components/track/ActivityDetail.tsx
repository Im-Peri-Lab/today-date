'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Undo2,
  Clock,
  Loader2,
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
import { DuplicateMenu } from './DuplicateMenu'
import { DetailBlock } from './DetailBlock'
import { DetailRow } from './DetailRow'
import { VisitRecordBlock } from './VisitRecordBlock'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { useActivity, useDeleteActivity, useUpdateActivity } from '@/hooks/useActivities'
import { activityFormSchema, type ActivityFormValues } from '@/lib/schemas/activitySchema'
import type { Activity } from '@/types'
import {
  DURATION_LABELS,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ICONS,
  STATUS_LABELS,
  STATUS_MENU_LABELS,
} from '@/lib/labels'
import { buildDetailHref, DEFAULT_LIST_RETURN_TO } from '@/lib/listReturn'
import { stashActivityDuplicate } from '@/lib/duplicatePrefill'
import { cn } from '@/lib/utils'
import { resolveHref } from '@/lib/url'
import { MapLink } from './MapLink'
import styles from '@/components/screens.module.css'

interface Props {
  id: string
  initialData?: Activity
  /** 'info' = 등록 정보 블록 / 'visit' = 방문 기록 블록을 편집모드로 열고 진입 */
  initialEdit?: 'info' | 'visit'
  returnTo?: string
}

export function ActivityDetail({ id, initialData, initialEdit, returnTo }: Props) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const { data: activity, isLoading, isError } = useActivity(id, initialData)
  const del = useDeleteActivity()
  const update = useUpdateActivity()

  const [editingInfo, setEditingInfo] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  // 삭제 성공 → router.push(목록)은 비동기 전환이라 즉시 반환된다. 이때 del.isPending이
  // false로 풀리면 실제 전환 전까지 다이얼로그가 열린 채 "삭제" 활성 상태로 깜빡인다.
  // push 직전 navigating=true로 잠가, 전환 완료(=언마운트)까지 다이얼로그를 열어두고
  // "삭제 중..." 비활성 상태로 유지한다. 상세 언마운트 시 자연 정리되므로 해제 불필요.
  const [navigating, setNavigating] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const [revertOpen, setRevertOpen] = useState(false)
  const listHref = returnTo ?? DEFAULT_LIST_RETURN_TO

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: { title: '', time_of_day: 'any', location: '', memo: '', reference_url: '', category_id: '' },
  })

  function fillForm() {
    if (!activity) return
    reset({
      title: activity.title,
      category_id: activity.category_id ?? '',
      duration_bucket: activity.duration_bucket ?? undefined,
      time_of_day: activity.time_of_day,
      location: activity.location ?? '',
      memo: activity.memo ?? '',
      reference_url: activity.reference_url ?? '',
    })
  }

  // initialEdit='info'(?edit=info)일 때 activity 로드 후 등록 정보 블록을 편집 모드로 연다.
  // ('visit'은 VisitRecordBlock이 initialEditing으로 직접 처리)
  const didInitEdit = useRef(false)
  useEffect(() => {
    if (didInitEdit.current || !activity || initialEdit !== 'info') return
    didInitEdit.current = true
    fillForm()
    setEditingInfo(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id, initialEdit])

  /* ── 핸들러 ── */

  function handleDelete() {
    // 토스트/에러 처리는 훅에 위임(중복 토스트 방지). 상세는 언마운트되지 않아 onSuccess가 정상 실행됨.
    del.mutate(id, {
      onSuccess: () => {
        setNavigating(true)
        // 복사하기와 동일: nextjs-toploader 는 history.pushState 시점에 done() 하므로
        // 이미 캐시된 목록으로의 push 는 바가 페인트되기 전에 끝나버린다.
        // start() 직후 한 프레임 뒤에 push 해 프로그레스 바가 먼저 보이도록 한다.
        topLoader.start()
        requestAnimationFrame(() => router.push(listHref))
      },
    })
  }

  function handleRevert() {
    update.mutate(
      { id, patch: { status: 'wishlist', visited_at: null, visited_end_at: null, rating: null, review_note: null } },
      {
        onSuccess: () => {
          setRevertOpen(false)
          toast.success('가보고 싶은 곳으로 옮겼어요')
        },
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  function startEditInfo() {
    fillForm()
    setEditingInfo(true)
  }

  // 복사하기: 등록 정보만 stash 후 신규 폼으로 이동 (리스트 카드와 동일 헬퍼 공유).
  // nextjs-toploader 는 history.pushState 시점에 바를 종료(done)한다. /activities/new 가 이미
  // 라우터 캐시에 있으면 push 가 거의 즉시 커밋돼 시작된 바가 페인트되기 전에 끝나버린다.
  // start() 직후 한 프레임 뒤에 push 해, 시작된 프로그레스 바가 먼저 보이도록 한다.
  function handleDuplicate() {
    if (!activity) return
    const href = stashActivityDuplicate(activity)
    topLoader.start()
    requestAnimationFrame(() => router.push(href))
  }

  function exitEditInfo() {
    setEditingInfo(false)
    // URL에서 ?edit= 제거 (재내비게이션 없이 히스토리만 교체)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', buildDetailHref(`/activities/${id}`, { returnTo }))
    }
  }

  const onSaveInfo = handleSubmit(async (values) => {
    if (!activity) return
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      location: values.location || null,
      memo: values.memo || null,
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
  const TimeOfDayIcon = activity ? TIME_OF_DAY_ICONS[activity.time_of_day] : null

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
      <div className="flex items-center justify-between">
        <Link href={listHref} className={styles.backLink}>
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
        {activity && !editingInfo && <DuplicateMenu onDuplicate={handleDuplicate} />}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          <Skeleton className={cn(styles.card, 'h-48 w-full')} />
          <Skeleton className={cn(styles.card, 'h-28 w-full')} />
        </div>
      ) : isError || !activity ? (
        <div className={cn(styles.empty, 'mt-4', styles.sub)}>활동을 찾을 수 없어요.</div>
      ) : (
        <>
          <div className="mt-5 space-y-5">
            {/* ── 등록 정보 블록 ──
                제목·카테고리를 블록 헤더 안으로 통합: 연필 수정 범위가 제목·카테고리까지
                포함됨이 자연스럽게 드러난다. */}
            <DetailBlock
              title="등록 정보"
              editing={editingInfo}
              onEdit={startEditInfo}
              onCancel={exitEditInfo}
              onSave={onSaveInfo}
              saving={isSubmitting || update.isPending}
              blockTitle={activity.title}
              blockCategory={
                activity.category ? <CategoryBadge category={activity.category} /> : undefined
              }
              headerExtra={
                /* 방문완료=회색(visitedTagVisited), 위시리스트=연보라(visitedTagWishlist) */
                <span className={cn(
                  styles.visitedTag,
                  activity.status === 'visited'
                    ? styles.visitedTagVisited
                    : styles.visitedTagWishlist,
                )}>
                  {STATUS_LABELS[activity.status]}
                </span>
              }
            >
              {editingInfo ? (
                <ActivityFields
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              ) : (
                /* 짧은 값: 2열 그리드 / 긴 텍스트(메모·링크): wide로 전체폭 / 모바일: 1열 */
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {activity.duration_bucket && (
                    <DetailRow label="소요시간">
                      {/* Clock 아이콘 — faint 톤(카테고리 보라보다 약하게, 위계 유지) */}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
                        {DURATION_LABELS[activity.duration_bucket]}
                      </span>
                    </DetailRow>
                  )}
                  <DetailRow label="시간대">
                    {/* Sun(주간) / Moon(야간) — faint 톤, 공용 매핑. 아무때나(any)는 아이콘 없이 라벨만 */}
                    <span className="inline-flex items-center gap-1.5">
                      {TimeOfDayIcon && (
                        <TimeOfDayIcon className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
                      )}
                      {TIME_OF_DAY_LABELS[activity.time_of_day]}
                    </span>
                  </DetailRow>
                  <DetailRow label="위치" wide>
                    {activity.location ? (
                      <MapLink query={activity.location} />
                    ) : (
                      <span className={styles.faint}>아직 위치가 없어요</span>
                    )}
                  </DetailRow>
                  <DetailRow label="메모" wide>
                    {activity.memo ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{activity.memo}</p>
                    ) : (
                      <span className={styles.faint}>아직 메모가 없어요</span>
                    )}
                  </DetailRow>
                  <DetailRow label="참고 링크" wide>
                    {activity.reference_url ? (
                      <a
                        href={resolveHref(activity.reference_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn('inline-flex max-w-full items-center gap-1.5 hover:underline', styles.textLink)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{activity.reference_url}</span>
                      </a>
                    ) : (
                      <span className={styles.faint}>참고 링크가 없어요</span>
                    )}
                  </DetailRow>

                  {/* 등록 메타 캡션 — 블록 맨 마지막, faint 톤.
                      sheetRow(border+padding) 대신 mt-3.5만 사용해 하단 여백 최소화 */}
                  {activity.created_at && (
                    <div
                      className={cn(
                        'sm:col-span-2 mt-3.5',
                        'flex flex-wrap items-center gap-x-3 gap-y-0.5',
                        styles.captionText,
                      )}
                    >
                      <span>
                        {new Date(activity.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        에 등록
                      </span>
                    </div>
                  )}
                </div>
              )}
            </DetailBlock>

            {/* ── 방문 기록 블록 (미방문이면 렌더 안 함) ── */}
            {activity.status === 'visited' && (
              <VisitRecordBlock
                track="activity"
                id={id}
                visitedAt={activity.visited_at}
                visitedEndAt={activity.visited_end_at}
                rating={activity.rating}
                reviewNote={activity.review_note}
                initialEditing={initialEdit === 'visit'}
                returnTo={returnTo}
              />
            )}
          </div>

          {/* ── 하단 액션 버튼 — 좌: 삭제(약한 톤) / 우: Primary(단색 액센트) ── */}
          {!editingInfo && (
            <div className="mt-6 flex items-center justify-between gap-3">
              {/* 좌: 삭제 — 평소 faint, hover 시 destructive 노출 */}
              <Button
                variant="ghost"
                className={cn(styles.detailDeleteBtn, 'h-9 gap-1.5')}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>

              {/* 우: Primary — --s-active-line(#7c3aed): 라이트·다크 동일, 다크 #c084fc 역전 방지 */}
              {activity.status === 'visited' ? (
                <Button
                  className={cn(styles.detailPrimaryBtn, 'h-9 gap-1.5 text-white hover:brightness-105')}
                  onClick={() => setRevertOpen(true)}
                >
                  <Undo2 className="h-4 w-4" />
                  {STATUS_MENU_LABELS.wishlist}
                </Button>
              ) : (
                <Button
                  className={cn(styles.detailPrimaryBtn, 'h-9 gap-1.5 text-white hover:brightness-105')}
                  onClick={() => setVisitedOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  다녀왔어요
                </Button>
              )}
            </div>
          )}

          {/* ── 다이얼로그 ── */}
          <DeleteConfirmDialog
            open={deleteOpen || navigating}
            onOpenChange={setDeleteOpen}
            title={activity.title}
            loading={del.isPending || navigating}
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
              visited_end_at: activity.visited_end_at,
              rating: activity.rating,
              review_note: activity.review_note,
            }}
          />
          <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
            <DialogContent className="max-w-xs">
              <DialogHeader>
                <DialogTitle>가보고 싶은 곳으로 되돌릴까요?</DialogTitle>
                <DialogDescription>
                  별점, 감상, 방문일이 모두 삭제됩니다. 되돌릴 수 없어요.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" disabled={update.isPending} />}>
                  취소
                </DialogClose>
                <Button onClick={handleRevert} disabled={update.isPending}>
                  {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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
