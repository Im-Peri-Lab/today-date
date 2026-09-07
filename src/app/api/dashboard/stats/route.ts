import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/data/dashboard'
import { requireCoupleScope } from '@/lib/auth/coupleScope'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const scope = await requireCoupleScope()
    if (!scope.ok) return scope.response

    const data = await getDashboardStats(scope.coupleId)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err)
    return NextResponse.json({ error: '통계를 불러오지 못했습니다.' }, { status: 500 })
  }
}
