import { getSupabaseClient } from '@/lib/supabase/client'
import type { DashboardStats } from '@/hooks/useDashboardStats'

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseClient()
  const countOpts = { count: 'exact' as const, head: true }

  const [wishAct, wishPlc, visitedAct, visitedPlc] = await Promise.all([
    supabase.from('activities').select('*', countOpts).eq('status', 'wishlist'),
    supabase.from('places').select('*', countOpts).eq('status', 'wishlist'),
    supabase.from('activities').select('*', countOpts).eq('status', 'visited'),
    supabase.from('places').select('*', countOpts).eq('status', 'visited'),
  ])

  return {
    wishlistActivities: wishAct.count ?? 0,
    wishlistPlaces: wishPlc.count ?? 0,
    visitedActivities: visitedAct.count ?? 0,
    visitedPlaces: visitedPlc.count ?? 0,
  }
}
