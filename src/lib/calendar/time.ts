import { nextDayIso, prevDayIso } from '@/lib/date'

/**
 * 시간 지정 일정(방문 예정 시간, 021)의 UTC 변환 — 전부 문자열·정수 연산(Date 객체 금지).
 * 앱은 한국어 단일 로케일이라 저장된 시간은 Asia/Seoul 벽시계로 본다. 한국은 DST 가 없어
 * UTC+9 고정 오프셋으로 충분하고, VTIMEZONE 없이 UTC 'Z' 값을 내보낸다(.ics·구글 공용).
 */

/** 시간 지정 일정 길이(분) — 종료 시간 입력이 없어 시작 + 이 값으로 잡는다. */
export const PLANNED_EVENT_DURATION_MINUTES = 120

/** Asia/Seoul 의 UTC 오프셋(분). */
const SEOUL_OFFSET_MINUTES = 9 * 60
const MINUTES_PER_DAY = 24 * 60

/**
 * Asia/Seoul 날짜('YYYY-MM-DD') + 시간('HH:mm') + 추가 분 → UTC 'YYYYMMDDTHHmmssZ'.
 * 자정·월말·연말·윤년을 넘는 날짜 이동은 nextDayIso/prevDayIso 로 하루씩 옮긴다.
 */
export function seoulToUtcStamp(dateIso: string, hhmm: string, addMinutes = 0): string {
  const [h, m] = hhmm.split(':').map(Number)
  let total = h * 60 + m + addMinutes - SEOUL_OFFSET_MINUTES
  let date = dateIso
  while (total < 0) {
    total += MINUTES_PER_DAY
    date = prevDayIso(date)
  }
  while (total >= MINUTES_PER_DAY) {
    total -= MINUTES_PER_DAY
    date = nextDayIso(date)
  }
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${date.replace(/-/g, '')}T${hh}${mm}00Z`
}

/** 시간 지정 일정의 시작·종료 UTC 스탬프. */
export function timedEventStamps(dateIso: string, hhmm: string): { start: string; end: string } {
  return {
    start: seoulToUtcStamp(dateIso, hhmm),
    end: seoulToUtcStamp(dateIso, hhmm, PLANNED_EVENT_DURATION_MINUTES),
  }
}
