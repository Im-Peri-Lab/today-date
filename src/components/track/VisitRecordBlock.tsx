'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RatingStars } from './RatingStars'
import { DetailBlock } from './DetailBlock'
import { useUpdateActivity } from '@/hooks/useActivities'
import { useUpdatePlace } from '@/hooks/usePlaces'
import { formatKoreanDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface VisitRecordBlockProps {
  track: 'activity' | 'place'
  id: string
  visitedAt: string | null
  rating: number | null
  reviewNote: string | null
  /** ?edit=visit 진입 시 방문 기록 블록을 처음부터 편집모드로 연다 */
  initialEditing?: boolean
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
  rating,
  reviewNote,
  initialEditing = false,
}: VisitRecordBlockProps) {
  const [editing, setEditing] = useState(initialEditing)
  // 방문 날짜 입력은 저장 값과 동일한 ISO('YYYY-MM-DD')를 그대로 바인딩(표시 변환은 보기 모드에서만).
  const [dateValue, setDateValue] = useState(visitedAt ?? '')
  const [ratingValue, setRatingValue] = useState(rating ?? 5)
  const [noteValue, setNoteValue] = useState(reviewNote ?? '')

  const updateActivity = useUpdateActivity()
  const updatePlace = useUpdatePlace()
  const saving = updateActivity.isPending || updatePlace.isPending

  function startEdit() {
    setDateValue(visitedAt ?? '')
    setRatingValue(rating ?? 5)
    setNoteValue(reviewNote ?? '')
    setEditing(true)
  }

  function exitEdit() {
    setEditing(false)
    // ?edit=visit로 진입했을 경우 URL에서 쿼리 제거 (재내비게이션 없이 히스토리만 교체)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  function handleSave() {
    const patch = {
      visited_at: dateValue || null,
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
            <Label htmlFor="visit_date">방문 날짜</Label>
            <Input
              id="visit_date"
              type="date"
              className={styles.dateInput}
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />
            {/* 한글 표시 캡션 — native input은 표시 포맷을 못 바꾸므로 저장값(ISO) 그대로 두고
                흐린 톤 캡션으로 "2026년 6월 5일"을 보조 노출(값 없으면 미표시) */}
            {dateValue && (
              <p className={cn('text-xs', styles.faint)}>{formatKoreanDate(dateValue)}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>별점</Label>
            <RatingStars value={ratingValue} onChange={setRatingValue} />
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
              {formatKoreanDate(visitedAt)}
            </div>
          )}
          {rating ? <RatingStars value={rating} size="sm" /> : null}
          {/* 한줄평: italic 인용구 느낌 + ink 톤(sub보다 따뜻하게) — 새 색상 없음 */}
          {reviewNote && (
            <p className={cn('whitespace-pre-wrap text-sm leading-relaxed italic', styles.ink)}>
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
