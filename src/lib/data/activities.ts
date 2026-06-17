import { getSupabaseClient } from '@/lib/supabase/client'
import type { Activity } from '@/types'

export async function getActivityById(id: string): Promise<Activity | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*, category:activity_categories(id,name,icon,color)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
