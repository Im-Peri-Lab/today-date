import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { requireCoupleScope } from '@/lib/auth/coupleScope'
import { isRowOwnedByCouple } from '@/lib/data/ownership'

export const dynamic = 'force-dynamic'

const schema = z.object({
  log_id: z.string().uuid(),
  selected_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    const scope = await requireCoupleScope()
    if (!scope.ok) return scope.response

    // 남의 추천 로그에 선택을 기록할 수 없다. 로그 id 는 추천 응답으로 돌려주는
    // 값이라 추측 대상이 되므로, 없는 로그와 남의 로그를 같은 404 로 닫는다.
    if (!(await isRowOwnedByCouple('recommendations_log', result.data.log_id, scope.coupleId))) {
      return NextResponse.json({ error: '추천 기록을 찾을 수 없습니다.' }, { status: 404 })
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('recommendations_log')
      .update({ selected_id: result.data.selected_id })
      .eq('id', result.data.log_id)
      .eq('couple_id', scope.coupleId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/recommend/select]', err)
    return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
