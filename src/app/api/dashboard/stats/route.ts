import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const countOpts = { count: 'exact' as const, head: true }

    const [wishAct, wishPlc, visitedAct, visitedPlc] = await Promise.all([
      supabase.from('activities').select('*', countOpts).eq('status', 'wishlist'),
      supabase.from('places').select('*', countOpts).eq('status', 'wishlist'),
      supabase.from('activities').select('*', countOpts).eq('status', 'visited'),
      supabase.from('places').select('*', countOpts).eq('status', 'visited'),
    ])

    return NextResponse.json({
      wishlistActivities: wishAct.count ?? 0,
      wishlistPlaces: wishPlc.count ?? 0,
      visitedActivities: visitedAct.count ?? 0,
      visitedPlaces: visitedPlc.count ?? 0,
    })
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err)
    return NextResponse.json({ error: '통계를 불러오지 못했습니다.' }, { status: 500 })
  }
}
