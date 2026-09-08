import { getSupabaseClient } from '@/lib/supabase/client'
import type { DashboardStats } from '@/hooks/useDashboardStats'

/** 8개 집계 쿼리 결과에서 오류 검사에 필요한 최소 형태. */
type QueryOutcome = { error: { message: string } | null }

/** 홈 대시보드 집계 — 세션 커플의 행만 센다(다른 커플의 개수/제목이 섞이면 그 자체로 유출이다). */
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
    supabase.from('activities').select('title').eq('status', 'wishlist').eq('couple_id', coupleId).order('created_at', titleOpts).limit(2),
    supabase.from('places').select('title').eq('status', 'wishlist').eq('couple_id', coupleId).order('created_at', titleOpts).limit(2),
    supabase.from('activities').select('title').eq('status', 'visited').eq('couple_id', coupleId).order('created_at', titleOpts).limit(2),
    supabase.from('places').select('title').eq('status', 'visited').eq('couple_id', coupleId).order('created_at', titleOpts).limit(2),
  ])

  /**
   * 8개 쿼리의 error 를 반드시 검사한다.
   *
   * supabase-js 는 네트워크 실패조차 throw 하지 않고 `{ data: null, error }` 로
   * 돌려준다. 이전 구현은 error 를 보지 않고 `count ?? 0` / `data ?? []` 로만
   * 읽었기 때문에, DB 가 완전히 죽은 상태에서도 200 에 "전부 0" 이 나갔다 —
   * 사용자에게는 장애가 아니라 "위시리스트가 비었다"로 보인다. 빈 워크스페이스와
   * 장애를 구별할 수 없는 응답은 없는 것보다 나쁘다.
   *
   * 실패한 쿼리의 이름을 함께 던진다 — 8개 중 어느 집계가 깨졌는지 로그에서
   * 바로 보이게 한다(§ /api/dashboard/stats 의 console.error).
   */
  const outcomes: [string, QueryOutcome][] = [
    ['위시리스트 액티비티 수', wishAct],
    ['위시리스트 다이닝 수', wishPlc],
    ['다녀온 액티비티 수', visitedAct],
    ['다녀온 다이닝 수', visitedPlc],
    ['위시리스트 액티비티 제목', wishActTitles],
    ['위시리스트 다이닝 제목', wishPlcTitles],
    ['다녀온 액티비티 제목', visitedActTitles],
    ['다녀온 다이닝 제목', visitedPlcTitles],
  ]

  for (const [label, outcome] of outcomes) {
    if (outcome.error) {
      throw new Error(`대시보드 집계 실패(${label}): ${outcome.error.message}`)
    }
  }

  return {
    wishlistActivities: wishAct.count ?? 0,
    wishlistPlaces: wishPlc.count ?? 0,
    visitedActivities: visitedAct.count ?? 0,
    visitedPlaces: visitedPlc.count ?? 0,
    wishlistActivityTitles: wishActTitles.data?.map(r => r.title) ?? [],
    wishlistPlaceTitles: wishPlcTitles.data?.map(r => r.title) ?? [],
    visitedActivityTitles: visitedActTitles.data?.map(r => r.title) ?? [],
    visitedPlaceTitles: visitedPlcTitles.data?.map(r => r.title) ?? [],
  }
}
