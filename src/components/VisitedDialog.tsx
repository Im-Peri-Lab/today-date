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
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RatingStars } from '@/components/track/RatingStars'
import { useUpdateActivity } from '@/hooks/useActivities'
import { useUpdatePlace } from '@/hooks/usePlaces'

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>다녀왔어요 💕</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-[color:var(--s-ink,#1a1033)]">{title}</span> 방문 기록을 남겨보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="visited_at">방문 날짜</Label>
            <Input
              id="visited_at"
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
            />
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

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>취소</DialogClose>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isPending ? '저장 중...' : '저장하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
