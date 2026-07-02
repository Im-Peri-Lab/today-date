'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Trash2, CheckCircle2, Undo2, MapPin, ExternalLink, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBadge } from './CategoryBadge'
import { PlaceFields } from './PlaceFields'
import { DetailBlock } from './DetailBlock'
import { DetailRow } from './DetailRow'
import { VisitRecordBlock } from './VisitRecordBlock'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { usePlace, useDeletePlace, useUpdatePlace } from '@/hooks/usePlaces'
import { placeFormSchema, type PlaceFormValues } from '@/lib/schemas/placeSchema'
import type { Place } from '@/types'
import { MEAL_LABELS, STATUS_LABELS, STATUS_MENU_LABELS } from '@/lib/labels'
import { buildDetailHref, DEFAULT_LIST_RETURN_TO } from '@/lib/listReturn'
import { cn } from '@/lib/utils'
import { resolveHref } from '@/lib/url'
import { MapLink } from './MapLink'
import styles from '@/components/screens.module.css'

interface Props {
  id: string
  initialData?: Place
  /** 'info' = 등록 정보 블록 / 'visit' = 방문 기록 블록을 편집모드로 열고 진입 */
  initialEdit?: 'info' | 'visit'
  returnTo?: string
}

export function PlaceDetail({ id, initialData, initialEdit, returnTo }: Props) {
  const router = useRouter()
  const { data: place, isLoading, isError } = usePlace(id, initialData)
  const del = useDeletePlace()
  const update = useUpdatePlace()

  const [editingInfo, setEditingInfo] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)
  const listHref = returnTo ?? DEFAULT_LIST_RETURN_TO

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: { title: '', area: '', location: '', meal_times: [], memo: '', reference_url: '', category_id: '' },
  })

  function fillForm() {
    if (!place) return
    reset({
      title: place.title,
      category_id: place.category_id ?? '',
      area: place.area,
      location: place.location ?? '',
      meal_times: place.meal_times,
      memo: place.memo ?? '',
      reference_url: place.reference_url ?? '',
    })
  }

  // initialEdit='info'(?edit=info)일 때 place 로드 후 등록 정보 블록을 편집 모드로 연다.
  // ('visit'은 VisitRecordBlock이 initialEditing으로 직접 처리)
  const didInitEdit = useRef(false)
  useEffect(() => {
    if (didInitEdit.current || !place || initialEdit !== 'info') return
    didInitEdit.current = true
    fillForm()
    setEditingInfo(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id, initialEdit])

  function handleDelete() {
    del.mutate(id, {
      onSuccess: () => {
        toast.success('삭제했어요')
        router.push(listHref)
      },
      onError: () => toast.error('삭제 중 오류가 발생했습니다.'),
    })
  }

  function handleRevert() {
    update.mutate(
      { id, patch: { status: 'wishlist' } },
      {
        onSuccess: () => toast.success('가보고 싶은 곳으로 옮겼어요'),
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
    // URL에서 ?edit= 제거 (재내비게이션 없이 히스토리만 교체)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', buildDetailHref(`/places/${id}`, { returnTo }))
    }
  }

  const onSaveInfo = handleSubmit(async (values) => {
    if (!place) return
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      location: values.location || null,
      memo: values.memo || null,
    }
    try {
      await update.mutateAsync({ id: place.id, patch: payload })
      toast.success('수정되었습니다!')
      exitEditInfo()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    }
  })

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
      <Link href={listHref} className={styles.backLink}>
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          <Skeleton className={cn(styles.card, 'h-48 w-full')} />
          <Skeleton className={cn(styles.card, 'h-28 w-full')} />
        </div>
      ) : isError || !place ? (
        <div className={cn(styles.empty, 'mt-4', styles.sub)}>장소를 찾을 수 없어요.</div>
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
              blockTitle={place.title}
              blockCategory={
                place.category ? <CategoryBadge category={place.category} /> : undefined
              }
              headerExtra={
                /* 방문완료=회색(visitedTagVisited), 위시리스트=연보라(visitedTagWishlist) */
                <span className={cn(
                  styles.visitedTag,
                  place.status === 'visited'
                    ? styles.visitedTagVisited
                    : styles.visitedTagWishlist,
                )}>
                  {STATUS_LABELS[place.status]}
                </span>
              }
            >
              {editingInfo ? (
                <PlaceFields
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              ) : (
                /* 짧은 값: 2열 그리드 / 긴 텍스트(메모·링크): wide로 전체폭 / 모바일: 1열 */
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {place.meal_times?.length > 0 && (
                    <DetailRow label="식사 시간">
                      {/* Utensils 아이콘 — faint 톤, 뱃지 그룹 앞에 위치.
                          mt-1: 선행 아이콘을 다른 행(소요시간·지역 등 ~3.5px)과 같은
                          오프셋에 맞춘다(뱃지 pill 대비 세로 중심도 함께 정렬). */}
                      <span className="inline-flex items-start gap-1.5">
                        <Utensils className={cn('h-3.5 w-3.5 shrink-0 mt-1', styles.faint)} />
                        <span className="flex flex-wrap gap-1.5">
                          {place.meal_times.map((m) => (
                            <span key={m} className={styles.mealBadge}>
                              {MEAL_LABELS[m]}
                            </span>
                          ))}
                        </span>
                      </span>
                    </DetailRow>
                  )}
                  {place.area && (
                    <DetailRow label="지역">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
                        {place.area}
                      </span>
                    </DetailRow>
                  )}
                  {place.location && (
                    <DetailRow label="위치" wide>
                      <MapLink query={place.location} />
                    </DetailRow>
                  )}
                  <DetailRow label="메모" wide>
                    {place.memo ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{place.memo}</p>
                    ) : (
                      <span className={styles.faint}>아직 메모가 없어요</span>
                    )}
                  </DetailRow>
                  <DetailRow label="참고 링크" wide>
                    {place.reference_url ? (
                      <a
                        href={resolveHref(place.reference_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn('inline-flex max-w-full items-center gap-1.5 hover:underline', styles.textLink)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{place.reference_url}</span>
                      </a>
                    ) : (
                      <span className={styles.faint}>참고 링크가 없어요</span>
                    )}
                  </DetailRow>

                  {/* 등록 메타 캡션 — 블록 맨 마지막, faint 톤.
                      sheetRow(border+padding) 대신 mt-3.5만 사용해 하단 여백 최소화 */}
                  {place.created_at && (
                    <div
                      className={cn(
                        'sm:col-span-2 mt-3.5',
                        'flex flex-wrap items-center gap-x-3 gap-y-0.5',
                        styles.captionText,
                      )}
                    >
                      <span>
                        {new Date(place.created_at).toLocaleDateString('ko-KR', {
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
            {place.status === 'visited' && (
              <VisitRecordBlock
                track="place"
                id={id}
                visitedAt={place.visited_at}
                rating={place.rating}
                reviewNote={place.review_note}
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
              {place.status === 'visited' ? (
                <Button
                  className={cn(styles.detailPrimaryBtn, 'h-9 gap-1.5 text-white hover:brightness-105')}
                  onClick={handleRevert}
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
            id={id}
            title={place.title}
            initial={{
              visited_at: place.visited_at,
              rating: place.rating,
              review_note: place.review_note,
            }}
          />
        </>
      )}
    </div>
  )
}
