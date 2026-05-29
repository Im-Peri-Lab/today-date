import type { SupabaseClient } from '@supabase/supabase-js'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * 추천 로그에서 두 종류의 id 집합을 구한다.
 * - recentIds: 최근 30일 이내 추천된 항목 (다양성 패널티용)
 * - everIds: 한 번이라도 추천된 항목 (새 항목 보너스용)
 */
export async function recommendedIdSets(
  supabase: SupabaseClient,
  track: 'activity' | 'place'
): Promise<{ recentIds: Set<string>; everIds: Set<string> }> {
  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString()
  const { data } = await supabase
    .from('recommendations_log')
    .select('recommended_ids, created_at')
    .eq('track', track)

  const recentIds = new Set<string>()
  const everIds = new Set<string>()

  for (const row of data ?? []) {
    const ids: string[] = row.recommended_ids ?? []
    const isRecent = typeof row.created_at === 'string' && row.created_at >= since
    for (const id of ids) {
      everIds.add(id)
      if (isRecent) recentIds.add(id)
    }
  }

  return { recentIds, everIds }
}

/**
 * 점수 상위 topN개를 뽑은 뒤 그 안에서 셔플하여 take개를 반환한다.
 * (상위권 안에서 약간의 다양성 부여)
 */
export function pickTopWithShuffle<T>(
  scored: { item: T; score: number }[],
  topN: number,
  take: number
): T[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  const top = sorted.slice(0, topN)

  // Fisher-Yates shuffle
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[top[i], top[j]] = [top[j], top[i]]
  }

  return top.slice(0, take).map((s) => s.item)
}
