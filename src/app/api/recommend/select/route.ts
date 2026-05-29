import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'

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

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('recommendations_log')
      .update({ selected_id: result.data.selected_id })
      .eq('id', result.data.log_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/recommend/select]', err)
    return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
