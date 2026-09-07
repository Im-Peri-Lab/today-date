import { getSupabaseClient } from '@/lib/supabase/client'
import type { Activity } from '@/types'

/**
 * coupleId 는 필수다 — 생략 가능한 인자로 두면 호출부 한 곳만 빠뜨려도
 * 격리가 조용히 풀린다. 없는 id 와 남의 커플 행은 똑같이 null 로 돌아간다.
 */
export async function getActivityById(id: string, coupleId: string): Promise<Activity | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*, category:activity_categories(id,name,icon,color)')
    .eq('id', id)
    .eq('couple_id', coupleId)
    .single()

  if (error) return null
  return data
}
