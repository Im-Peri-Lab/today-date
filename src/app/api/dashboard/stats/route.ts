import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/data/dashboard'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getDashboardStats()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err)
    return NextResponse.json({ error: '통계를 불러오지 못했습니다.' }, { status: 500 })
  }
}
