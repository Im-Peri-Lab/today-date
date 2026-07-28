import type { ActivityRecommendResponse, PlaceRecommendResponse } from '@/hooks/useRecommend'

/**
 * 추천위저드 결과 화면 재진입(뒤로가기로 인한 재마운트) 시 결과 payload를 sessionStorage에
 * 보존해 재조회 없이 그대로 복원하기 위한 저장소.
 *
 * 왜 재조회로 복원하면 안 되는가: 추천 알고리즘은 상위 후보 중 일부를 Fisher-Yates로 셔플해
 * 뽑는다(`pickTopWithShuffle`) — 같은 조건으로 다시 조회해도 매번 다른 카드가 나올 수 있어
 * "정확히 그 결과 화면으로 복귀"가 깨진다. 대신 마지막으로 성공한 응답 자체를 저장해두고
 * 그대로 재사용한다.
 *
 * - "다른 추천 보기"·"더 짧은 일정" 등 사용자가 능동적으로 새 결과를 요청하는 흐름은
 *   여전히 실제 API를 다시 호출하고, 그 성공 결과로 이 저장소를 덮어쓴다(재조회 유지) —
 *   트랙별로 슬롯이 하나뿐이라 매 성공 응답마다 그대로 최신값으로 교체되는 구조.
 * - conditionsKey(선택 조건을 그대로 직렬화한 문자열)가 일치할 때만 유효 — 위저드를
 *   처음부터 다시 시작하거나 조건이 바뀌면(새 추천 세션) 다음 정상 조회가 이 슬롯을
 *   덮어쓰므로 자동으로 무효화된다. 별도 clear API는 두지 않는다.
 * - 복사하기(`duplicatePrefill.ts`)와 달리 one-shot(read+remove)이 아니다: 결과 화면은
 *   상세→뒤로가기를 여러 번 오갈 수 있으므로 조건이 유지되는 한 계속 유효해야 한다.
 */

const ACTIVITY_RESULT_KEY = 'today-date:recommend-result:activity'
const PLACE_RESULT_KEY = 'today-date:recommend-result:place'

interface StoredActivityResult {
  conditionsKey: string
  includeShorter: boolean
  data: ActivityRecommendResponse
}

export function stashActivityResult(
  conditionsKey: string,
  includeShorter: boolean,
  data: ActivityRecommendResponse
) {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredActivityResult = { conditionsKey, includeShorter, data }
    sessionStorage.setItem(ACTIVITY_RESULT_KEY, JSON.stringify(payload))
  } catch {
    /* sessionStorage 차단(프라이빗 모드 등) 환경은 무시 — 호출부가 재조회로 폴백한다 */
  }
}

export function readActivityResult(
  conditionsKey: string
): { includeShorter: boolean; data: ActivityRecommendResponse } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(ACTIVITY_RESULT_KEY)
    if (raw == null) return null
    const parsed = JSON.parse(raw) as StoredActivityResult
    if (parsed.conditionsKey !== conditionsKey) return null
    return { includeShorter: parsed.includeShorter, data: parsed.data }
  } catch {
    return null
  }
}

interface StoredPlaceResult {
  conditionsKey: string
  data: PlaceRecommendResponse
}

export function stashPlaceResult(conditionsKey: string, data: PlaceRecommendResponse) {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredPlaceResult = { conditionsKey, data }
    sessionStorage.setItem(PLACE_RESULT_KEY, JSON.stringify(payload))
  } catch {
    /* sessionStorage 차단(프라이빗 모드 등) 환경은 무시 — 호출부가 재조회로 폴백한다 */
  }
}

export function readPlaceResult(conditionsKey: string): PlaceRecommendResponse | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PLACE_RESULT_KEY)
    if (raw == null) return null
    const parsed = JSON.parse(raw) as StoredPlaceResult
    if (parsed.conditionsKey !== conditionsKey) return null
    return parsed.data
  } catch {
    return null
  }
}
