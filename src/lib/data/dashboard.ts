import { getSupabaseClient } from '@/lib/supabase/client'
import type { DashboardStats } from '@/hooks/useDashboardStats'
import { orderByListRule } from '@/lib/data/listOrder'
import { reportError } from '@/lib/observability'

/** 집계 쿼리 결과에서 오류 검사에 필요한 최소 형태. */
type QueryOutcome = { error: { message: string } | null }

/**
 * 홈 대시보드 집계 — 세션 커플의 행만 센다(다른 커플의 개수/제목이 섞이면 그 자체로 유출이다).
 *
 * 미리보기 제목의 정렬: 위시리스트는 등록 최신순, 다녀온 곳은 `/list` 와 같은 규칙(방문일 최신 →
 * 마지막 수정 최신)이라 홈의 "최근 항목"이 `/list` 의 1번 카드와 일치한다(§ listOrder.ts).
 */
export async function getDashboardStats(coupleId: string): Promise<DashboardStats> {
  const supabase = getSupabaseClient()
  const countOpts = { count: 'exact' as const, head: true }
  const titleOpts = { ascending: false }

  const [
    wishAct, wishPlc, visitedAct, visitedPlc,
    wishActTitles, wishPlcTitles, visitedActTitles, visitedPlcTitles,
  ] = await Promise.all([
    supabase.from('activities').select('*', countOpts).eq('status', 'wishlist').eq('couple_id', coupleId),
    supabase.from('places').select('*', countOpts).eq('status', 'wishlist').eq('couple_id', coupleId),
    supabase.from('activities').select('*', countOpts).eq('status', 'visited').eq('couple_id', coupleId),
    supabase.from('places').select('*', countOpts).eq('status', 'visited').eq('couple_id', coupleId),
    supabase.from('activities').select('title, planned_at').eq('status', 'wishlist').eq('couple_id', coupleId).order('created_at', titleOpts).limit(2),
    supabase.from('places').select('title, planned_at').eq('status', 'wishlist').eq('couple_id', coupleId).order('created_at', titleOpts).limit(2),
    orderByListRule(supabase.from('activities').select('title, visited_at').eq('status', 'visited').eq('couple_id', coupleId), 'visited').limit(2),
    orderByListRule(supabase.from('places').select('title, visited_at').eq('status', 'visited').eq('couple_id', coupleId), 'visited').limit(2),
  ])

  /**
   * 개수 쿼리 4개의 error 는 반드시 검사하고, 하나라도 실패하면 전체를 던진다.
   *
   * supabase-js 는 네트워크 실패조차 throw 하지 않고 `{ data: null, error }` 로
   * 돌려준다. 이전 구현은 error 를 보지 않고 `count ?? 0` 으로만 읽었기 때문에,
   * DB 가 완전히 죽은 상태에서도 200 에 "전부 0" 이 나갔다 — 사용자에게는 장애가 아니라
   * "위시리스트가 비었다"로 보인다. 빈 워크스페이스와 장애를 구별할 수 없는 응답은
   * 없는 것보다 나쁘다. 0개로 잘못 보이는 것보다 오류 화면이 낫다.
   *
   * 실패한 쿼리의 이름을 함께 던진다 — 4개 중 어느 집계가 깨졌는지 로그에서 바로 보이게 한다.
   */
  const counts: [string, QueryOutcome][] = [
    ['위시리스트 액티비티 수', wishAct],
    ['위시리스트 다이닝 수', wishPlc],
    ['다녀온 액티비티 수', visitedAct],
    ['다녀온 다이닝 수', visitedPlc],
  ]

  for (const [label, outcome] of counts) {
    if (outcome.error) {
      throw new Error(`대시보드 집계 실패(${label}): ${outcome.error.message}`)
    }
  }

  /**
   * 미리보기 제목 쿼리 4개는 부가 정보다 — 실패해도 홈 전체를 깨지 않고, 그 타일의 미리보기만
   * 비운 채 개수는 정상으로 돌려준다(타일은 "개수만" 보여주는 기존 방어 분기를 쓴다).
   * 실패는 삼키지 않고 Sentry 로 보낸다. 쿼리 이름이 태그에 남는다.
   */
  const previewOutcomes: [string, QueryOutcome][] = [
    ['위시리스트 액티비티 제목', wishActTitles],
    ['위시리스트 다이닝 제목', wishPlcTitles],
    ['다녀온 액티비티 제목', visitedActTitles],
    ['다녀온 다이닝 제목', visitedPlcTitles],
  ]

  for (const [label, outcome] of previewOutcomes) {
    if (outcome.error) {
      reportError(
        `[getDashboardStats] 미리보기 실패(${label})`,
        new Error(`대시보드 미리보기 실패(${label}): ${outcome.error.message}`)
      )
    }
  }

  return {
    wishlistActivities: wishAct.count ?? 0,
    wishlistPlaces: wishPlc.count ?? 0,
    visitedActivities: visitedAct.count ?? 0,
    visitedPlaces: visitedPlc.count ?? 0,
    wishlistActivityTitles: wishActTitles.data?.map(r => r.title) ?? [],
    wishlistActivityPreviews: wishActTitles.data?.map(r => ({ title: r.title, date: r.planned_at ?? null })) ?? [],
    wishlistPlaceTitles: wishPlcTitles.data?.map(r => r.title) ?? [],
    wishlistPlacePreviews: wishPlcTitles.data?.map(r => ({ title: r.title, date: r.planned_at ?? null })) ?? [],
    visitedActivityTitles: visitedActTitles.data?.map(r => r.title) ?? [],
    visitedActivityPreviews: visitedActTitles.data?.map(r => ({ title: r.title, date: r.visited_at ?? null })) ?? [],
    visitedPlaceTitles: visitedPlcTitles.data?.map(r => r.title) ?? [],
    visitedPlacePreviews: visitedPlcTitles.data?.map(r => ({ title: r.title, date: r.visited_at ?? null })) ?? [],
  }
}
