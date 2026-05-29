import type { SupabaseClient } from '@supabase/supabase-js'
import type { Activity, DurationBucket, TimeOfDay } from '@/types'
import { DURATION_LABELS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import { recommendedIdSets, pickTopWithShuffle } from './shared'

export interface ActivityRecommendInput {
  duration_bucket: DurationBucket
  time_of_day?: TimeOfDay
  category_ids?: string[]
  include_visited?: boolean
}

export interface ActivityRecommendResult {
  recommendations: Activity[]
  reason: string
}

export async function recommendActivities(
  supabase: SupabaseClient,
  input: ActivityRecommendInput
): Promise<ActivityRecommendResult> {
  const statuses = input.include_visited ? ['wishlist', 'visited'] : ['wishlist']
  const tod: TimeOfDay = input.time_of_day ?? 'any'
  const categoryIds = input.category_ids ?? []

  const { data, error } = await supabase
    .from('activities')
    .select('*, category:activity_categories(id,name,icon,color)')
    .in('status', statuses)
  if (error) throw error

  let pool: Activity[] = (data ?? []) as Activity[]

  // 시간대 필터: day/night면 정확히 일치하거나 'any'인 항목만
  if (tod !== 'any') {
    pool = pool.filter((a) => a.time_of_day === tod || a.time_of_day === 'any')
  }

  // 카테고리 필터 (선택)
  if (categoryIds.length > 0) {
    pool = pool.filter((a) => a.category_id && categoryIds.includes(a.category_id))
  }

  const { recentIds, everIds } = await recommendedIdSets(supabase, 'activity')

  const scored = pool.map((a) => {
    let score = 0
    if (a.duration_bucket === input.duration_bucket) score += 10
    if (tod !== 'any') {
      if (a.time_of_day === tod) score += 5
      else if (a.time_of_day === 'any') score += 2
    } else if (a.time_of_day === 'any') {
      score += 2
    }
    if (categoryIds.length > 0 && a.category_id && categoryIds.includes(a.category_id)) score += 3
    if (recentIds.has(a.id)) score -= 2
    if (!everIds.has(a.id)) score += 1
    return { item: a, score }
  })

  const recommendations = pickTopWithShuffle(scored, 5, 3)
  const reason = buildReason(input, recommendations.length)

  return { recommendations, reason }
}

function buildReason(input: ActivityRecommendInput, count: number): string {
  if (count === 0) {
    return '조건에 맞는 활동을 찾지 못했어요.'
  }
  const duration = DURATION_LABELS[input.duration_bucket]
  const tod = input.time_of_day ?? 'any'
  if (tod !== 'any') {
    return `${duration} · ${TIME_OF_DAY_LABELS[tod]} 조건에 맞는 활동이에요 💜`
  }
  return `${duration} 동안 즐기기 좋은 활동이에요 💜`
}
