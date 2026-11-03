/**
 * 방문 예정 시간 저장값(021) — 폼·다이얼로그가 API 로 보낼 planned_time 을 정하는 단일 규칙.
 * 시간 칸이 비어 있으면(처음부터 비었든 × 로 지웠든) null = 종일. 날짜가 없으면 시간도 null
 * (API 짝 규칙 — 날짜 없이 시간만 보내지 않는다). 그 외에는 'HH:mm' 그대로.
 *
 * 시간 칸은 날짜가 있으면 항상 노출되므로 미리 채우기는 하지 않는다 — 빈 값이 종일을 뜻하므로,
 * 미리 채우면 종일로 두려던 사용자의 저장에 시간이 들어간다(PROJECT_CONTEXT §20).
 */
export function plannedTimePayload(date: string | null | undefined, time: string | null | undefined): string | null {
  return date && time ? time : null
}
