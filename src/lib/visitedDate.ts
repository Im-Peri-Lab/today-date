/**
 * 기기 로컬 타임존 기준 오늘 날짜(ISO 'YYYY-MM-DD').
 * toISOString() 은 UTC 라 KST 새벽(00:00~08:59)에 하루 전 날짜가 나오므로, 로컬 오프셋을 보정한다.
 */
export function localTodayIso(now: Date = new Date()): string {
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

/**
 * '다녀왔어요' 등록 시 방문 날짜 기본값.
 * - 방문예정일이 있고 오늘이거나 지난 날짜 → 방문예정일
 * - 방문예정일이 없거나 미래 날짜 → 오늘
 * 비교는 'YYYY-MM-DD' 문자열끼리(같은 형식이면 사전순 = 날짜순) — Date 변환 없이 해서 UTC 밀림이 없다.
 */
export function defaultVisitedDate(
  plannedAt: string | null | undefined,
  today: string = localTodayIso()
): string {
  const planned = plannedAt ? plannedAt.slice(0, 10) : ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(planned) && planned <= today) return planned
  return today
}
