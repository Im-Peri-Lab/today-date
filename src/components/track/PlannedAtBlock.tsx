'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar, CalendarX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DetailBlock } from './DetailBlock'
import { PlannedAtDialog } from './PlannedAtDialog'
import { RevertConfirmDialog } from './RevertConfirmDialog'
import { useUpdateActivity } from '@/hooks/useActivities'
import { useUpdatePlace } from '@/hooks/usePlaces'
import { formatDotDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface PlannedAtBlockProps {
  track: 'activity' | 'place'
  id: string
  title: string
  plannedAt: string | null
}

/**
 * 방문 예정 블록 — 방문 기록 블록과 같은 계위(DetailBlock 셸). 위시리스트에서만 렌더(호출부 책임).
 * 값 없음: "언제 갈까요?" → 날짜 다이얼로그 / 값 있음: 날짜 + "날짜 미정으로"(확인 거침) + 연필(날짜 수정).
 */
export function PlannedAtBlock({ track, id, title, plannedAt }: PlannedAtBlockProps) {
  const [dateOpen, setDateOpen] = useState(false)
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
        hideEdit={!plannedAt}
        onEdit={() => setDateOpen(true)}
        onCancel={() => {}}
        onSave={() => {}}
        saving={false}
      >
        {plannedAt ? (
          <div key="set" className="flex items-center justify-between gap-3">
            <span className={cn('inline-flex items-center gap-1.5', styles.bodyText)}>
              <Calendar className={cn('h-3.5 w-3.5 shrink-0', styles.accent)} />
              {formatDotDate(plannedAt)}
            </span>
            <Button variant="outline" className="h-9 gap-1.5 px-4" onClick={() => setClearOpen(true)}>
              <CalendarX className="h-4 w-4" />
              날짜 미정으로
            </Button>
          </div>
        ) : (
          <div key="empty" className="flex items-center justify-between gap-3">
            <span className={styles.faint}>아직 방문 예정일이 없어요</span>
            <Button
              className={cn(styles.detailPrimaryBtn, 'h-9 gap-1.5 px-4 text-white hover:brightness-105')}
              onClick={() => setDateOpen(true)}
            >
              <Calendar className="h-4 w-4" />
              언제 갈까요?
            </Button>
          </div>
        )}
      </DetailBlock>

      <PlannedAtDialog
        open={dateOpen}
        onOpenChange={setDateOpen}
        track={track}
        id={id}
        title={title}
        value={plannedAt}
      />
      <RevertConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        loading={mutation.isPending}
        onConfirm={handleClear}
        title="날짜 미정으로 되돌릴까요?"
        description="입력한 방문 예정일이 삭제됩니다."
        confirmLabel="미정으로"
      />
    </>
  )
}
