import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function startOfMonthISODate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const monthStart = startOfMonthISODate()

    const countOpts = { count: 'exact' as const, head: true }

    const [totalAct, totalPlc, visitedAct, visitedPlc, monthAct, monthPlc] = await Promise.all([
      supabase.from('activities').select('*', countOpts),
      supabase.from('places').select('*', countOpts),
      supabase.from('activities').select('*', countOpts).eq('status', 'visited'),
      supabase.from('places').select('*', countOpts).eq('status', 'visited'),
      supabase
        .from('activities')
        .select('*', countOpts)
        .eq('status', 'visited')
        .gte('visited_at', monthStart),
      supabase
        .from('places')
        .select('*', countOpts)
        .eq('status', 'visited')
        .gte('visited_at', monthStart),
    ])

    return NextResponse.json({
      totalActivities: totalAct.count ?? 0,
      totalPlaces: totalPlc.count ?? 0,
      totalVisited: (visitedAct.count ?? 0) + (visitedPlc.count ?? 0),
      visitedThisMonth: (monthAct.count ?? 0) + (monthPlc.count ?? 0),
    })
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err)
    return NextResponse.json({ error: '통계를 불러오지 못했습니다.' }, { status: 500 })
  }
}
