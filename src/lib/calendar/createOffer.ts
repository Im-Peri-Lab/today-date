import type { CalendarTrack } from './event'

/**
 * "캘린더에도 추가할까요?" 제안 1회성 예약 (sessionStorage).
 *
 * 등록 폼이 예정일과 함께 저장하고 상세로 이동하기 직전에 stash 하고, 상세가 항목을 읽은 뒤
 * take(읽기 후 즉시 삭제)해 토스트를 띄운다. one-shot 이라 새로고침·뒤로가기로 같은 상세에
 * 다시 와도 토스트가 또 뜨지 않는다. track:id 로 묶어 두어, 도착이 실패해 남은 값이 나중에
 * 다른 항목 상세에서 엉뚱하게 뜨지 않게 한다.
 */
const KEY = 'today-date:calendar-offer'

export function stashCalendarOffer(track: CalendarTrack, id: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY, `${track}:${id}`)
  } catch {
    /* sessionStorage 차단 환경은 제안을 생략한다 */
  }
}

/** 예약이 이 항목 것이면 true 를 돌려주고 값은 항상 지운다. */
export function takeCalendarOffer(track: CalendarTrack, id: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw == null) return false
    sessionStorage.removeItem(KEY)
    return raw === `${track}:${id}`
  } catch {
    return false
  }
}
