import { getSupabaseClient } from '@/lib/supabase/client'
import type { Place } from '@/types'

export async function getPlaceById(id: string): Promise<Place | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('places')
    .select('*, category:place_categories(id,name,icon,color)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
