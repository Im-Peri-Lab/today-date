'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DatePickerField } from '@/components/forms/DatePickerField'
import { VisitPeriodToggle } from '@/components/forms/VisitPeriodToggle'
import { RatingStars } from './RatingStars'
import { DetailBlock } from './DetailBlock'
import { useUpdateActivity } from '@/hooks/useActivities'
import { useUpdatePlace } from '@/hooks/usePlaces'
import { formatDotDateRange } from '@/lib/date'
import { buildDetailHref } from '@/lib/listReturn'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface VisitRecordBlockProps {
  track: 'activity' | 'place'
  id: string
  visitedAt: string | null
  /** 방문 종료일(기간 방문). activities 전용 — place 에서는 넘기지 않는다. */
  visitedEndAt?: string | null
  rating: number | null
  reviewNote: string | null
  /** ?edit=visit 진입 시 방문 기록 블록을 처음부터 편집모드로 연다 */
  initialEditing?: boolean
  returnTo?: string
}

/**
 * 방문 기록 블록 — 이 화면의 하이라이트.
 * 등록 정보 블록과 동일한 DetailBlock 셸 + 연필 → 인라인 편집(모달/이동 없음).
 * 저장은 기존 mutation(useUpdateActivity/useUpdatePlace)을 그대로 사용한다(저장 로직 불변).
 */
export function VisitRecordBlock({
  track,
  id,
  visitedAt,
  visitedEndAt,
  rating,
  reviewNote,
  initialEditing = false,
  returnTo,
}: VisitRecordBlockProps) {
  // 기간(시작~종료) 방문은 activities 전용. places 는 단일 날짜 그대로.
  const isActivity = track === 'activity'
  const [editing, setEditing] = useState(initialEditing)
  // 방문 날짜 입력은 저장 값과 동일한 ISO('YYYY-MM-DD')를 그대로 바인딩(표시 변환은 보기 모드에서만).
  const [dateValue, setDateValue] = useState(visitedAt ?? '')
  const [endValue, setEndValue] = useState(visitedEndAt ?? '')
  const [showEnd, setShowEnd] = useState(Boolean(visitedEndAt))
  const [ratingValue, setRatingValue] = useState(rating ?? 5)
  const [noteValue, setNoteValue] = useState(reviewNote ?? '')

  const updateActivity = useUpdateActivity()
  const updatePlace = useUpdatePlace()
  const saving = updateActivity.isPending || updatePlace.isPending

  function startEdit() {
    setDateValue(visitedAt ?? '')
    setEndValue(visitedEndAt ?? '')
    setShowEnd(Boolean(visitedEndAt))
    setRatingValue(rating ?? 5)
    setNoteValue(reviewNote ?? '')
    setEditing(true)
  }

  function exitEdit() {
    setEditing(false)
    // ?edit=visit로 진입했을 경우 URL에서 쿼리 제거 (재내비게이션 없이 히스토리만 교체)
    if (typeof window !== 'undefined') {
      const detailPath = `/${track === 'activity' ? 'activities' : 'places'}/${id}`
      window.history.replaceState(null, '', buildDetailHref(detailPath, { returnTo }))
    }
  }

  function handleSave() {
    const start = dateValue || null
    // 종료일은 activity + 토글 켬 + 값 있을 때만. end < start 는 저장 차단(클라 단 방어).
    const end = isActivity && showEnd && endValue ? endValue : null
    if (start && end && end < start) {
      toast.error('종료일은 시작일보다 빠를 수 없어요.')
      return
    }
    const patch = {
      visited_at: start,
      // places 경로엔 visited_end_at 을 절대 싣지 않는다(activity 한정).
      ...(isActivity ? { visited_end_at: end } : {}),
      rating: ratingValue,
      review_note: noteValue || null,
    }
    const mutation = track === 'activity' ? updateActivity : updatePlace
    mutation.mutate(
      { id, patch },
      {
        onSuccess: () => {
          exitEdit()
          toast.success('방문 기록을 수정했어요')
        },
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.'),
      }
    )
  }

  return (
    <DetailBlock
      title="방문 기록"
      editing={editing}
      onEdit={startEdit}
      onCancel={exitEdit}
      onSave={handleSave}
      saving={saving}
    >
      {editing ? (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              {/* activity 기간 방문(토글 on)이면 '시작' 라벨로, 아니면 기존 '방문 날짜' */}
              <Label htmlFor="visit_date">{isActivity && showEnd ? '방문 시작일' : '방문 날짜'}</Label>
              {isActivity && (
                <VisitPeriodToggle checked={showEnd} onChange={setShowEnd} controls="visit_end_date" />
              )}
            </div>
            <DatePickerField id="visit_date" value={dateValue} onChange={setDateValue} />
            {/* 종료일 필드: 토글 on 시 아래로 부드럽게 펼쳐짐(grid-rows 0fr→1fr). activity 한정. */}
            {isActivity && (
              <div className={cn(styles.periodEnd, showEnd && styles.periodEndOpen)}>
                <div className={styles.periodEndInner}>
                  <div className="space-y-1.5 pt-1.5">
                    <Label htmlFor="visit_end_date">방문 종료일</Label>
                    <DatePickerField id="visit_end_date" value={endValue} onChange={setEndValue} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>별점</Label>
            <RatingStars value={ratingValue} onChange={setRatingValue} size="lg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visit_note">후기</Label>
            <Textarea
              id="visit_note"
              rows={3}
              placeholder="어땠는지 기록해보세요 (선택)"
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 방문일과 별점을 두 줄로 분리 — 날짜 위, 별점 아래 */}
          {visitedAt && (
            <div className={cn('inline-flex items-center gap-1.5 text-base font-medium', styles.ink)}>
              <Calendar className={cn('h-4 w-4 shrink-0', styles.accent)} />
              {formatDotDateRange(visitedAt, isActivity ? visitedEndAt : null)}
            </div>
          )}
          {rating ? <RatingStars value={rating} size="sm" /> : null}
          {/* 한줄평: italic 인용구 느낌 + ink 톤(sub보다 따뜻하게) — 새 색상 없음 */}
          {reviewNote && (
            <p className={cn('whitespace-pre-wrap leading-relaxed italic', styles.bodyText)}>
              {reviewNote}
            </p>
          )}
          {!visitedAt && !rating && !reviewNote && (
            <p className={cn('text-sm', styles.faint)}>아직 방문 기록이 없어요</p>
          )}
        </div>
      )}
    </DetailBlock>
  )
}
