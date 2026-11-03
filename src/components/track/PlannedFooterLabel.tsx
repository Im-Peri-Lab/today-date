import { Calendar } from 'lucide-react'
import { formatDotDateCompact, formatKoreanTime } from '@/lib/date'

interface PlannedFooterLabelProps {
  plannedAt: string
  plannedTime: string | null
}

/**
 * 위시리스트 카드 footer 의 방문 예정 한 줄(ActivityCard·PlaceCard 공용) — "26.12.19 오후 7:00 방문 예정".
 * 한 줄 슬롯(부모 p 의 min-h-4 · nowrap · overflow-hidden)을 그대로 쓰고, 폭이 모자라면 시간(유일한
 * min-w-0 truncate 조각)부터 말줄임한다 — 날짜·"방문 예정"은 shrink-0. 시간이 없으면 기존 출력 그대로.
 */
export function PlannedFooterLabel({ plannedAt, plannedTime }: PlannedFooterLabelProps) {
  const time = formatKoreanTime(plannedTime)
  return (
    <>
      <Calendar className="h-3 w-3 shrink-0" />
      <span className="shrink-0">{formatDotDateCompact(plannedAt)}</span>
      {time && <span className="min-w-0 truncate">{time}</span>}
      <span className="shrink-0">방문 예정</span>
    </>
  )
}
