/**
 * 일정(방문 예정 날짜·시간 / 방문 기록 시작일·종료일) 저장이 어떤 종류인지 판정하는 단일 규칙.
 * 저장 직후 토스트를 고르는 데 쓴다(PlannedAtDialog·VisitRecordBlock 공용).
 *
 * - 'created'   : 이전 날짜가 없었고 이번에 생겼다 → 처음 등록 토스트("추가")
 * - 'changed'   : 이전 날짜가 있었고 날짜·종료일·시간 중 하나라도 실제로 바뀌었다
 *                 → "일정이 바뀌었어요. 이미 추가한 캘린더 일정은 직접 수정해 주세요" + "다시 추가"
 * - 'unchanged' : 그 외(그대로 재저장, 별점·후기만 수정, 날짜를 비움 등) → 기존 토스트 그대로
 *
 * 값 비교는 빈 문자열·undefined 를 null 로, 시간은 'HH:mm' 으로 맞춘 뒤 한다(DB 는 'HH:mm:ss' 로 줄 수 있음).
 */
export interface ScheduleValue {
  date?: string | null
  /** 방문 기록 종료일(activity 기간 방문). 방문 예정에는 없음 */
  end?: string | null
  /** 방문 예정 시작 시간. 방문 기록에는 없음 */
  time?: string | null
}

export type ScheduleSaveKind = 'created' | 'changed' | 'unchanged'

function norm(v: string | null | undefined): string | null {
  return v ? v : null
}

function normTime(v: string | null | undefined): string | null {
  return v ? v.slice(0, 5) : null
}

export function classifyScheduleSave(prev: ScheduleValue, next: ScheduleValue): ScheduleSaveKind {
  const prevDate = norm(prev.date)
  const nextDate = norm(next.date)
  if (!nextDate) return 'unchanged'
  if (!prevDate) return 'created'
  const changed =
    prevDate !== nextDate ||
    norm(prev.end) !== norm(next.end) ||
    normTime(prev.time) !== normTime(next.time)
  return changed ? 'changed' : 'unchanged'
}
