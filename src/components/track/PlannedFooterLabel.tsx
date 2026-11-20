import { Calendar } from 'lucide-react'
import { daysUntil, formatDday, formatDotDateCompact, formatKoreanTime } from '@/lib/date'
import { useTodayKst } from '@/hooks/useTodayKst'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface PlannedFooterLabelProps {
  plannedAt: string
  plannedTime: string | null
}

/**
 * 위시리스트 카드 footer 의 방문 예정 한 줄(ActivityCard·PlaceCard 공용) — "26.12.19 오후 7:00 방문 예정 D-3".
 * 한 줄 슬롯(부모 p 의 min-h-4 · nowrap · overflow-hidden)을 그대로 쓰고, 폭이 모자라면 시간(유일한
 * min-w-0 truncate 조각)부터 말줄임한다 — 날짜·"방문 예정"·D-day 는 shrink-0. 시간이 없으면 시간 조각만 빠진다.
 *
 * D-day: 다가오는 일정 "D-n"·오늘 "D-DAY"(굵게)는 accent, 지난 일정 "D+n"은 destructive(수정 필요 신호).
 * "오늘"은 정렬과 같은 KST(`useTodayKst`)이고 마운트 전에는 그리지 않는다(hydration 안전).
 */
export function PlannedFooterLabel({ plannedAt, plannedTime }: PlannedFooterLabelProps) {
  const time = formatKoreanTime(plannedTime)
  const today = useTodayKst()
  const days = today ? daysUntil(plannedAt, today) : null
  return (
    <>
      <Calendar className="h-3 w-3 shrink-0" />
      <span className="shrink-0">{formatDotDateCompact(plannedAt)}</span>
      {time && <span className="min-w-0 truncate">{time}</span>}
      <span className="shrink-0">방문 예정</span>
      {days !== null && (
        <span
          className={cn(
            'ml-0.5 shrink-0',
            days < 0 ? styles.ddayPast : styles.ddayUpcoming,
            days === 0 && styles.ddayToday
          )}
        >
          {formatDday(days)}
        </span>
      )}
    </>
  )
}
