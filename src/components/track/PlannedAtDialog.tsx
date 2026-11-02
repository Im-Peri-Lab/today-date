'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePickerField } from '@/components/forms/DatePickerField'
import { useUpdateActivity } from '@/hooks/useActivities'
import { useUpdatePlace } from '@/hooks/usePlaces'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface PlannedAtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  track: 'activity' | 'place'
  id: string
  title: string
  /** 현재 저장된 방문 예정일(ISO) — 없으면 null */
  value: string | null
}

/**
 * 방문 예정일 등록/수정 다이얼로그 — 상세 "방문 예정" 블록과 카드 ⋮ 메뉴가 공용.
 * 날짜 입력 + 저장하기만 둔다. 값을 통째로 비우는 건 블록의 "날짜 미정으로"가 전담하므로
 * 여기엔 지우기 수단이 없다(저장 버튼은 값이 있어야 활성).
 */
export function PlannedAtDialog({ open, onOpenChange, track, id, title, value }: PlannedAtDialogProps) {
  const [date, setDate] = useState(value ?? '')
  const updateActivity = useUpdateActivity()
  const updatePlace = useUpdatePlace()
  const isPending = updateActivity.isPending || updatePlace.isPending

  // 다이얼로그가 열릴 때마다 현재 값으로 동기화
  useEffect(() => {
    if (open) setDate(value ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSave() {
    if (!date) return
    const mutation = track === 'activity' ? updateActivity : updatePlace
    mutation.mutate(
      { id, patch: { planned_at: date } },
      {
        onSuccess: () => {
          toast.success('방문 예정일을 저장했어요')
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* VisitedDialog 와 같은 박스 호흡·헤더 위계·풀폭 Primary 풋터 — 닫기는 상단 X 하나뿐 */}
      <DialogContent className="px-5 pt-6 pb-5">
        <DialogHeader className="gap-0 mb-1">
          <DialogTitle>언제 갈까요?</DialogTitle>
          <DialogDescription className={styles.pageSubtitle}>
            <span className="font-medium text-[color:var(--s-ink,#1a1033)]">{title}</span> 방문 예정일을 정해보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="planned_at_dialog">방문 예정일</Label>
          <DatePickerField
            id="planned_at_dialog"
            value={date}
            onChange={setDate}
          />
        </div>

        <DialogFooter className="-mx-5 -mb-5 p-5">
          <Button
            onClick={handleSave}
            disabled={isPending || !date}
            className={cn(styles.detailPrimaryBtn, 'h-10 w-full text-white hover:brightness-105')}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? '저장 중...' : '저장하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
