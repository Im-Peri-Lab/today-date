/**
 * 목록 정렬 규칙의 단일 출처 — `/api/activities`·`/api/places` GET 과 홈 대시보드 미리보기가 공유한다.
 *
 * - 다녀온 곳(`visited`): 방문일(`visited_at`) 최신순, 같으면 마지막 수정(`updated_at`) 최신순.
 *   방문일이 없는 레코드는 뒤로(`nullsFirst: false`). DB 쿼리 단계(`orderByListRule`)에서 끝난다.
 * - 위시리스트(`wishlist`): 3그룹 정렬(`sortWishlistRows`). "오늘"은 KST 기준.
 *   ① 오늘 이후(오늘 포함) 예정: 예정일 가까운 순 → 종일(`planned_time` NULL) 먼저 → 시작 시간 빠른 순
 *   ② 지난 예정: 예정일 최근 순 → (같은 날이면 ①과 같은 시간 규칙)
 *   ③ 예정 없음: 등록(`created_at`) 최신순
 *   모든 그룹의 마지막 동률은 등록 최신순. "방문예정만" 필터는 ③을 쿼리에서 빼기만 하고
 *   (`.not('planned_at','is',null)`, 호출부 담당) 순서 규칙은 같다.
 *   그룹 경계가 "오늘"에 따라 달라 PostgREST `.order()` 만으로는 표현할 수 없으므로,
 *   DB 에서는 등록 최신순으로 받아오고 API 가 응답 직전에 `sortWishlistRows` 로 다시 정렬한다
 *   (목록은 페이지 나눔 없이 전부 받으므로 전체에 그대로 적용된다).
 *
 * 홈 "다녀온 곳" 미리보기의 1번 항목이 `/list` 의 1번 카드와 항상 같도록, 두 곳이 같은 함수를 쓴다
 * (규칙을 각자 구현하면 한쪽만 바뀌어 어긋난다). 홈 위시리스트 미리보기는 의도적으로 이 규칙과
 * 연결하지 않는다 — 등록 최신순 그대로(§ lib/data/dashboard.ts).
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

export interface WishlistSortable {
  planned_at?: string | null
  planned_time?: string | null
  created_at: string
}

/** 0: 오늘 이후(오늘 포함) 예정, 1: 지난 예정, 2: 예정 없음. */
function wishlistGroup(row: WishlistSortable, today: string): 0 | 1 | 2 {
  if (!row.planned_at) return 2
  return row.planned_at >= today ? 0 : 1
}

function compareStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * 위시리스트 3그룹 정렬(위 주석 참고). 원본은 건드리지 않고 새 배열을 돌려준다.
 * `today` 는 KST 기준 'YYYY-MM-DD'(`todayKstIso()`). 날짜·시간은 ISO 문자열이라 사전순 비교가 곧 시간순이다.
 */
export function sortWishlistRows<T extends WishlistSortable>(rows: readonly T[], today: string): T[] {
  return [...rows].sort((a, b) => {
    const ga = wishlistGroup(a, today)
    const gb = wishlistGroup(b, today)
    if (ga !== gb) return ga - gb

    if (ga !== 2 && a.planned_at !== b.planned_at) {
      const byDate = compareStr(a.planned_at!, b.planned_at!)
      return ga === 0 ? byDate : -byDate
    }
    if (ga !== 2 && (a.planned_time ?? null) !== (b.planned_time ?? null)) {
      if (!a.planned_time) return -1 // 종일 먼저
      if (!b.planned_time) return 1
      return compareStr(a.planned_time, b.planned_time)
    }
    return -compareStr(a.created_at, b.created_at) // 등록 최신순
  })
}
