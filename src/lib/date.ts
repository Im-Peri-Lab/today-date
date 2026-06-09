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
