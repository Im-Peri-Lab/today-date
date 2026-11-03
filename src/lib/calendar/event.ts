import type { Activity, Place } from '@/types'
import { resolveHref } from '@/lib/url'

/**
 * 항목(activity/place) → 캘린더 이벤트 데이터. .ics 와 구글 캘린더 URL 이 이 한 모양을 공유한다.
 * 날짜는 전부 ISO 문자열('YYYY-MM-DD')로만 다룬다(Date 객체 금지 — lib/date.ts 원칙).
 */

export type CalendarTrack = 'activity' | 'place'
export type CalendarItem = Activity | Place

export interface CalendarEvent {
  /** `{track}-{id}@todaydate` — activity/place id 충돌 방지를 위해 track 을 반드시 포함 */
  uid: string
  title: string
  /** 종일 일정 시작일(ISO) */
  startDate: string
  /** 종일 일정 마지막 날(ISO, 포함). 배타 종료일(+1일) 변환은 .ics·구글 URL 빌더가 한다. */
  endDate: string
  /** 비어 있으면 빈 문자열 */
  location: string
  description: string
}

export interface CalendarEventOptions {
  /** 제목 머리말(useCalendarTitlePrefix). 공백뿐이면 무시 */
  titlePrefix?: string
  /** 상세 화면 링크의 origin (예: https://example.com) */
  origin: string
}

/**
 * 캘린더에 올릴 날짜. 위시리스트=planned_at 하루, 다녀온 곳=visited_at~visited_end_at
 * (기간은 activity 만, place 는 단일일). 날짜가 없거나 보관(archived) 항목이면 null —
 * 진입점 3곳이 "날짜 있을 때만 노출"을 이 한 함수로 판단한다.
 */
export function getCalendarDates(
  track: CalendarTrack,
  item: CalendarItem,
): { start: string; end: string } | null {
  if (item.status === 'wishlist') {
    return item.planned_at ? { start: item.planned_at, end: item.planned_at } : null
  }
  if (item.status === 'visited' && item.visited_at) {
    const start = item.visited_at
    const end = track === 'activity' ? (item as Activity).visited_end_at : null
    // end < start 는 저장 단계에서 막지만, 어긋난 값이 와도 단일일로 안전하게 접는다.
    return { start, end: end && end >= start ? end : start }
  }
  return null
}

/** 다녀온 곳 전용 후기 줄(별점 ★개수 + review_note) */
function visitLines(item: CalendarItem): string[] {
  const lines: string[] = []
  if (item.rating) lines.push(`별점: ${'★'.repeat(item.rating)}`)
  if (item.review_note) lines.push(`후기: ${item.review_note}`)
  return lines
}

export function buildCalendarEvent(
  track: CalendarTrack,
  item: CalendarItem,
  { titlePrefix = '', origin }: CalendarEventOptions,
): CalendarEvent | null {
  const dates = getCalendarDates(track, item)
  if (!dates) return null

  const prefix = titlePrefix.trim() ? titlePrefix : ''
  // 장소: location 우선, 없으면 다이닝(place)은 area
  const location = item.location || (track === 'place' ? (item as Place).area : '') || ''
  const detailUrl = `${origin}/${track === 'activity' ? 'activities' : 'places'}/${item.id}`

  const description = [
    item.memo,
    item.category?.name ? `카테고리: ${item.category.name}` : null,
    item.reference_url ? `참고 링크: ${resolveHref(item.reference_url)}` : null,
    `상세 보기: ${detailUrl}`,
    ...(item.status === 'visited' ? visitLines(item) : []),
  ]
    .filter(Boolean)
    .join('\n')

  return {
    uid: `${track}-${item.id}@todaydate`,
    title: `${prefix}${item.title}`,
    startDate: dates.start,
    endDate: dates.end,
    location,
    description,
  }
}
