'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DatePickerField } from '@/components/forms/DatePickerField'
import { RatingStars } from '@/components/track/RatingStars'
import { useUpdateActivity } from '@/hooks/useActivities'
import { useUpdatePlace } from '@/hooks/usePlaces'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

interface VisitedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  track: 'activity' | 'place'
  id: string
  title: string
  initial?: {
    visited_at?: string | null
    rating?: number | null
    review_note?: string | null
  }
  onSuccess?: () => void
}

export function VisitedDialog({
  open,
  onOpenChange,
  track,
  id,
  title,
  initial,
  onSuccess,
}: VisitedDialogProps) {
  const [visitedAt, setVisitedAt] = useState(initial?.visited_at ?? todayISO())
  const [rating, setRating] = useState(initial?.rating ?? 5)
  const [reviewNote, setReviewNote] = useState(initial?.review_note ?? '')

  const updateActivity = useUpdateActivity()
  const updatePlace = useUpdatePlace()
  const isPending = updateActivity.isPending || updatePlace.isPending

  // 다이얼로그가 열릴 때마다 초기값 동기화
  useEffect(() => {
    if (open) {
      setVisitedAt(initial?.visited_at ?? todayISO())
      setRating(initial?.rating ?? 5)
      setReviewNote(initial?.review_note ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleSave() {
    const patch = {
      status: 'visited' as const,
      visited_at: visitedAt || todayISO(),
      rating,
      review_note: reviewNote || null,
    }

    const mutation = track === 'activity' ? updateActivity : updatePlace
    mutation.mutate(
      { id, patch },
      {
        onSuccess: () => {
          toast.success('다녀온 곳으로 옮겼어요! 💕')
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 박스 호흡: 기본 p-4 → 상단 pt-6(24px, 페이지 헤더 mt-6 호흡과 비슷), 좌우 px-5(20px),
          하단 pb-5(20px). 폼 요소 크기·간격은 불변, 박스 패딩만 키운다. */}
      <DialogContent className="px-5 pt-6 pb-5">
        {/* 헤더 위계: 활동 추가 페이지(`/activities/new`)와 동일하게 page 헤더 클래스를 그대로 사용.
            pageTitle(h1, ~27px/600/-0.01em) + pageSubtitle(--s-sub, margin-top 0.25rem)로 두 덩어리 위계를 통일.
            gap-0: 제목↔설명 간격은 pageSubtitle 자체 margin-top이 담당(추가 페이지 블록 흐름과 동일).
            mb-1: 설명↔첫 라벨 간격을 추가 페이지 mt-5(20px)에 맞춤(그리드 gap-4 16px + 4px). */}
        <DialogHeader className="gap-0 mb-1">
          <DialogTitle className={styles.pageTitle}>다녀왔어요 💕</DialogTitle>
          <DialogDescription className={styles.pageSubtitle}>
            <span className="font-medium text-[color:var(--s-ink,#1a1033)]">{title}</span> 방문 기록을 남겨보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="visited_at">방문 날짜</Label>
            <DatePickerField id="visited_at" value={visitedAt} onChange={setVisitedAt} />
          </div>

          <div className="space-y-1.5">
            <Label>별점</Label>
            <RatingStars value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review_note">후기</Label>
            <Textarea
              id="review_note"
              rows={3}
              placeholder="어땠는지 기록해보세요 (선택)"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>
        </div>

        {/* 신규 데이터 생성 액션 → 풀폭 Primary 48px(추가 화면 FormLayout과 동일 패턴, 스킬 §6).
            기록 수정 화면의 32px 콘텐츠폭과는 "수정 vs 신규"의 의도된 위계 차이라 통일하지 않는다. */}
        {/* 입력 폼 다이얼로그 → 닫기 수단은 상단 X 하나만(스킬 다이얼로그 §). 하단엔 저장하기 CTA만
            남겨 유일한 주행동으로 또렷하게. 풋터는 박스 가장자리까지 full-bleed track 바 →
            늘어난 콘텐츠 패딩(px-5/pb-5)에 맞춰 -mx-5/-mb-5로 가장자리 정렬, 내부 p-5로 버튼 호흡 통일. */}
        <DialogFooter className="-mx-5 -mb-5 p-5">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className={cn(styles.detailPrimaryBtn, 'h-12 w-full text-white hover:brightness-105')}
          >
            {isPending ? '저장 중...' : '저장하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
