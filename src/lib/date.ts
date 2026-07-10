/**
 * 표시용 날짜 포맷. 저장 값(ISO 'YYYY-MM-DD')은 절대 건드리지 않고
 * 화면에 보여줄 때만 한글 형식("2026년 4월 6일")으로 변환한다.
 *
 * new Date('YYYY-MM-DD') 는 UTC 자정으로 파싱되어 로컬 타임존에 따라 하루가
 * 밀릴 수 있으므로, 문자열을 직접 분해해 표시한다.
 */
export function formatKoreanDate(iso?: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${y}년 ${m}월 ${d}일`
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 점 구분 날짜 + 요일 — "2026.05.28 (목)"(YYYY.MM.DD (요일)). 방문 날짜 표시의 단일 출처.
 * 네이티브 date 입력 박스의 표시 텍스트·카드 방문일·방문 기록 보기 모드가 모두 이 함수를 쓴다.
 * 저장값(ISO)은 불변. 요일 계산용 Date는 연/월/일 인자로 로컬 생성(문자열 파싱 아님)이라 타임존 안전.
 * (요일이 무의미한 "등록일"은 formatKoreanDate 사용)
 */
export function formatDotDate(iso?: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const wd = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()]
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${wd})`
}

/**
 * 방문 기간 표시 — 방문일 표시의 단일 출처(카드·상세 공용, activities 기간 방문용).
 * end 가 없거나 start 와 같으면 단일 날짜(formatDotDate)로 축약, 다르면 "start ~ end".
 * 저장값(ISO)은 불변이며 각 날짜는 formatDotDate 로 위임(요일·타임존 처리 일원화).
 */
export function formatDotDateRange(start?: string | null, end?: string | null): string {
  if (!start) return ''
  if (!end || end === start) return formatDotDate(start)
  return `${formatDotDate(start)} ~ ${formatDotDate(end)}`
}

/** 요일 없는 2자리 연도 점 날짜 — "26.06.25". 리스트 카드 기간 표시 전용 내부 헬퍼. */
function formatDotDateCompact(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${String(y).slice(-2)}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`
}

/**
 * 리스트 카드 전용 기간 표시 — 카드 폭에서 요일 포함 풀 포맷이 줄바꿈되는 문제 때문에
 * **기간일 때만** 요일을 생략하고 연도를 2자리로 줄인다: "26.06.25 ~ 26.06.28".
 * 단일 날짜(또는 start===end)는 기존 카드 관례를 그대로 유지 — `formatDotDate`(요일·4자리 연도).
 * 상세 화면은 이 함수를 쓰지 않고 `formatDotDateRange`(요일 포함) 그대로 사용한다.
 */
export function formatDotDateRangeCompact(start?: string | null, end?: string | null): string {
  if (!start) return ''
  if (!end || end === start) return formatDotDate(start)
  return `${formatDotDateCompact(start)} ~ ${formatDotDateCompact(end)}`
}
