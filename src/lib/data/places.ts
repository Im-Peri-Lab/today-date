import { getSupabaseClient } from '@/lib/supabase/client'
import type { Place } from '@/types'

/** coupleId 필수 — 사유는 getActivityById() 주석 참고. */
export async function getPlaceById(id: string, coupleId: string): Promise<Place | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('places')
    .select('*, category:place_categories(id,name,icon,color)')
    .eq('id', id)
    .eq('couple_id', coupleId)
    .single()

  if (error) return null
  return data
}
