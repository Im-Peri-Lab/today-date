import { getSupabaseClient } from '@/lib/supabase/client'
import type { DashboardStats } from '@/hooks/useDashboardStats'

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseClient()
  const countOpts = { count: 'exact' as const, head: true }
  const titleOpts = { ascending: false }

  const [
    wishAct, wishPlc, visitedAct, visitedPlc,
    wishActTitles, wishPlcTitles, visitedActTitles, visitedPlcTitles,
  ] = await Promise.all([
    supabase.from('activities').select('*', countOpts).eq('status', 'wishlist'),
    supabase.from('places').select('*', countOpts).eq('status', 'wishlist'),
    supabase.from('activities').select('*', countOpts).eq('status', 'visited'),
    supabase.from('places').select('*', countOpts).eq('status', 'visited'),
    supabase.from('activities').select('title').eq('status', 'wishlist').order('created_at', titleOpts).limit(2),
    supabase.from('places').select('title').eq('status', 'wishlist').order('created_at', titleOpts).limit(2),
    supabase.from('activities').select('title').eq('status', 'visited').order('created_at', titleOpts).limit(2),
    supabase.from('places').select('title').eq('status', 'visited').order('created_at', titleOpts).limit(2),
  ])

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
