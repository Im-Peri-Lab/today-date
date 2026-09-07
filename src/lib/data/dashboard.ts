import { getSupabaseClient } from '@/lib/supabase/client'
import type { DashboardStats } from '@/hooks/useDashboardStats'

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
