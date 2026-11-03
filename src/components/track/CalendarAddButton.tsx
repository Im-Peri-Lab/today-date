'use client'

import { ExternalLink } from 'lucide-react'
import { CalendarTitlePrefixDialog } from '@/components/CalendarTitlePrefixDialog'
import { useCalendarAdd } from '@/hooks/useCalendarAdd'
import { getCalendarDates, type CalendarItem, type CalendarTrack } from '@/lib/calendar/event'
import styles from '@/components/screens.module.css'

/**
 * 날짜 값 바로 옆에 두는 "캘린더에 추가" 아이콘 버튼 — 누르면 기기 기준 캘린더로 바로 실행한다.
 * 캘린더 모양 아이콘은 날짜 앞 고정 달력 아이콘과 겹쳐 보여 일부러 쓰지 않는다.
 * 날짜가 없는 항목에는 렌더하지 않는다.
 */
export function CalendarAddButton({ track, item }: { track: CalendarTrack; item: CalendarItem }) {
  const calendar = useCalendarAdd(track)

  if (!getCalendarDates(track, item)) return null

  return (
    // -my-1: 28px 버튼이 날짜 텍스트 줄(~21px)을 키우지 않도록 세로 여백을 상쇄(MapLink 의 -mt-1 과 같은 이유)
    <span className="-my-1 flex shrink-0 items-center">
      <button
        type="button"
        className={styles.mapActionBtn}
        aria-label="캘린더에 추가"
        onClick={() => calendar.add(item)}
      >
        <ExternalLink className="h-4 w-4" />
      </button>
      <CalendarTitlePrefixDialog {...calendar.prefixDialogProps} />
    </span>
  )
}
