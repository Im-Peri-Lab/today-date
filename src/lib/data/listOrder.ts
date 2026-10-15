/**
 * 목록 정렬 규칙의 단일 출처 — `/api/activities`·`/api/places` GET 과 홈 대시보드 미리보기가 공유한다.
 *
 * - 다녀온 곳(`visited`): 방문일(`visited_at`) 최신순, 같으면 마지막 수정(`updated_at`) 최신순.
 *   방문일이 없는 레코드는 뒤로(`nullsFirst: false`).
 * - 그 외(위시리스트 등): 등록(`created_at`) 최신순.
 *
 * 홈 "다녀온 곳" 미리보기의 1번 항목이 `/list` 의 1번 카드와 항상 같도록, 두 곳이 같은 함수를 쓴다
 * (규칙을 각자 구현하면 한쪽만 바뀌어 어긋난다).
 */
export function orderByListRule<
  Q extends {
    order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => Q
  },
>(query: Q, status: string): Q {
  return status === 'visited'
    ? query
        .order('visited_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
    : query.order('created_at', { ascending: false })
}
