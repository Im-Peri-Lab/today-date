'use client'

import { ExternalLink, ChevronDown } from 'lucide-react'
import { CalendarAppSheet } from './CalendarAppSheet'
import { useCalendarAdd } from '@/hooks/useCalendarAdd'
import { getCalendarDates, type CalendarItem, type CalendarTrack } from '@/lib/calendar/event'
import styles from '@/components/screens.module.css'

/**
 * 날짜 값 바로 옆에 두는 "캘린더에 추가" 컨트롤 — MapLink 의 액션 쌍과 같은 구조·톤.
 * - 메인(ExternalLink): 기억된 캘린더로 바로 실행, 최초엔 선택 시트.
 * - ▾: 선택 시트(캘린더 + 제목 머리말).
 * 캘린더 모양 아이콘은 날짜 앞 고정 달력 아이콘과 겹쳐 보여 일부러 쓰지 않는다.
 * 날짜가 없는 항목에는 렌더하지 않는다.
 */
export function CalendarAddButton({ track, item }: { track: CalendarTrack; item: CalendarItem }) {
  const calendar = useCalendarAdd(track)

  if (!getCalendarDates(track, item)) return null

  return (
    // -my-1: 28px 버튼이 날짜 텍스트 줄(~21px)을 키우지 않도록 세로 여백을 상쇄(MapLink 의 -mt-1 과 같은 이유)
    <span className="-my-1 flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        className={styles.mapActionBtn}
        aria-label="캘린더에 추가"
        onClick={() => calendar.add(item)}
      >
        <ExternalLink className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={styles.mapActionBtn}
        aria-label="캘린더 선택"
        onClick={() => calendar.openSheet(item)}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <CalendarAppSheet {...calendar.sheetProps} />
    </span>
  )
}
