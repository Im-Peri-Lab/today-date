import type { SupabaseClient } from '@supabase/supabase-js'
import type { Place, MealTime } from '@/types'
import { MEAL_LABELS } from '@/lib/labels'
import { recommendedIdSets, pickTopWithShuffle } from './shared'

export interface PlaceRecommendInput {
  meal_time: MealTime
  location?: string
  category_ids?: string[]
  q?: string
  include_visited?: boolean
}

export interface PlaceRecommendResult {
  recommendations: Place[]
  reason: string
  /** 필터 통과 후보 풀 크기(scored.length). 클라이언트의 "다른 추천 보기" 노출 판단용. */
  poolSize: number
}

export async function recommendPlaces(
  supabase: SupabaseClient,
  input: PlaceRecommendInput
): Promise<PlaceRecommendResult> {
  const statuses = input.include_visited ? ['wishlist', 'visited'] : ['wishlist']
  const categoryIds = input.category_ids ?? []
  const location = input.location?.trim() ?? ''
  const q = input.q?.trim() ?? ''

  const { data, error } = await supabase
    .from('places')
    .select('*, category:place_categories(id,name,icon,color)')
    .in('status', statuses)
  if (error) throw error

  let pool: Place[] = (data ?? []) as Place[]

  // 식사시간 필터: meal_time이 meal_times 배열에 포함된 항목만
  pool = pool.filter((p) => Array.isArray(p.meal_times) && p.meal_times.includes(input.meal_time))

  // 카테고리 필터 (선택)
  if (categoryIds.length > 0) {
    pool = pool.filter((p) => p.category_id && categoryIds.includes(p.category_id))
  }

  const locationLower = location.toLowerCase()

  // 지역 필터: location 입력이 있을 때만 부분포함(소문자)으로 후보를 좁힘 (없으면 전체 — 현행 유지)
  if (locationLower) {
    pool = pool.filter((p) => p.location && p.location.toLowerCase().includes(locationLower))
  }

  const { recentIds, everIds } = await recommendedIdSets(supabase, 'place')

  const qLower = q.toLowerCase()

  const scored = pool.map((p) => {
    let score = 0
    if (categoryIds.length > 0 && p.category_id && categoryIds.includes(p.category_id)) score += 3
    if (q) {
      const inTitle = p.title?.toLowerCase().includes(qLower)
      const inMemo = p.memo?.toLowerCase().includes(qLower)
      if (inTitle || inMemo) score += 5
    }
    if (recentIds.has(p.id)) score -= 2
    if (!everIds.has(p.id)) score += 1
    return { item: p, score }
  })

  const recommendations = pickTopWithShuffle(scored, 5, 3)
  const reason = buildReason(input, recommendations.length)

  return { recommendations, reason, poolSize: scored.length }
}

function buildReason(input: PlaceRecommendInput, count: number): string {
  if (count === 0) {
    return '조건에 맞는 장소를 찾지 못했어요.'
  }
  const meal = MEAL_LABELS[input.meal_time]
  const location = input.location?.trim()
  if (location) {
    return `${location} 근처 ${meal} 장소를 찾아봤어요 💜`
  }
  return `${meal}에 가기 좋은 장소예요 💜`
}
