'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar } from 'lucide-react'
import { DetailBlock } from './DetailBlock'
import { CalendarAddButton } from './CalendarAddButton'
import { PlannedAtClearDialog } from './PlannedAtClearDialog'
import { useUpdateActivity } from '@/hooks/useActivities'
import { useUpdatePlace } from '@/hooks/usePlaces'
import { formatDotDate } from '@/lib/date'
import type { CalendarItem } from '@/lib/calendar/event'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface PlannedAtBlockProps {
  track: 'activity' | 'place'
  id: string
  /** 캘린더 이벤트(제목·장소·메모 등)를 만들 항목 */
  item: CalendarItem
  /** 저장된 방문 예정일(ISO). 값이 있을 때만 이 블록을 렌더한다(호출부 책임) */
  plannedAt: string
  /** 연필 → 날짜 수정 다이얼로그(PlannedAtDialog)는 호출부가 소유 — 하단 "언제 갈까요?"와 공용 */
  onEdit: () => void
}

/**
 * 방문 예정 블록 — 방문 기록 블록과 같은 생명주기. 값이 없으면 블록 없이 하단 "언제 갈까요?" 버튼만,
 * 저장하면 블록 등장(+버튼 사라짐), 휴지통 → 확인 후 지우면 블록 사라지고 버튼 복귀.
 * 연필(수정)-휴지통(지우기) 순, 휴지통이 모서리 앵커. 등록 정보 블록의 쌍과 같은 mapActionBtn 슬롯·간격.
 */
export function PlannedAtBlock({ track, id, item, plannedAt, onEdit }: PlannedAtBlockProps) {
  const [clearOpen, setClearOpen] = useState(false)
  const updateActivity = useUpdateActivity()
  const updatePlace = useUpdatePlace()
  const mutation = track === 'activity' ? updateActivity : updatePlace

  function handleClear() {
    mutation.mutate(
      { id, patch: { planned_at: null } },
      {
        onSuccess: () => {
          setClearOpen(false)
          toast.success('방문 예정일을 비웠어요')
        },
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  return (
    <>
      <DetailBlock
        title="방문 예정"
        editing={false}
        onEdit={onEdit}
        onClear={() => setClearOpen(true)}
        onCancel={() => {}}
        onSave={() => {}}
        saving={false}
      >
        <div className="flex items-center gap-1">
          <span className={cn('inline-flex items-center gap-1.5', styles.bodyText)}>
            <Calendar className={cn('h-3.5 w-3.5 shrink-0', styles.accent)} />
            {formatDotDate(plannedAt)}
          </span>
          <CalendarAddButton track={track} item={item} />
        </div>
      </DetailBlock>

      <PlannedAtClearDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        loading={mutation.isPending}
        onConfirm={handleClear}
        />
    </>
  )
}
