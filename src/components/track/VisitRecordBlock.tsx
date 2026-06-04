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
}: VisitRecordBlockProps) {
  const [editing, setEditing] = useState(false)
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
          setEditing(false)
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
      onCancel={() => setEditing(false)}
      onSave={handleSave}
      saving={saving}
    >
      {editing ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="visit_date">방문 날짜</Label>
            <Input
              id="visit_date"
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />
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
        <div className="space-y-3">
          {/* 하이라이트: 방문일 + 별점을 또렷하게 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {visitedAt && (
              <span
                className={cn('inline-flex items-center gap-1.5 text-base font-medium', styles.ink)}
              >
                <Calendar className={cn('h-4 w-4 shrink-0', styles.accent)} />
                {formatKoreanDate(visitedAt)}
              </span>
            )}
            {rating ? <RatingStars value={rating} size="md" /> : null}
          </div>
          {reviewNote && (
            <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', styles.sub)}>
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
