import { getSupabaseClient } from '@/lib/supabase/client'

/** 소유권 확인이 필요한 도메인 테이블 — couple_id 를 가진 세 테이블뿐이다. */
export type OwnedTable = 'activities' | 'places' | 'recommendations_log'

/**
 * UPDATE/DELETE 전 소유권 확인.
 *
 * 왜 사전 확인이 필요한가 — PostgREST 의 update/delete 는 조건에 맞는 행이 0개여도
 * 오류가 아니다. `.eq('couple_id', ...)` 만 걸고 결과를 보지 않으면 남의 행을 향한
 * 요청이 "0건 변경 + 200 성공"으로 응답되어, 호출자는 자기 요청이 반영된 줄로 안다.
 * 그래서 대상 행의 존재와 소유를 먼저 확인하고, 아니면 404 로 끝낸다.
 *
 * 왜 403 이 아니라 404 인가 — 403 은 "그 id 는 존재하지만 네 것이 아니다"를 알려준다.
 * id 를 대입해 보는 것만으로 다른 커플의 데이터 존재 여부를 열거할 수 있게 되므로,
 * 남의 행과 없는 행을 호출자 입장에서 구분 불가능하게 만든다.
 *
 * 조회 자체가 실패하면 throw 한다 — 일시적 DB 오류를 "없는 행"으로 읽어
 * 404 로 응답하면 정상 소유자에게 데이터가 사라진 것처럼 보인다.
 */
export async function isRowOwnedByCouple(
  table: OwnedTable,
  id: string,
  coupleId: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('couple_id', coupleId)
    .maybeSingle()

  if (error) throw new Error(`${table} 소유권 조회 실패: ${error.message}`)

  return data !== null
}
