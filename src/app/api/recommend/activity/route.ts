import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { recommendActivities } from '@/lib/recommend/activity'

export const dynamic = 'force-dynamic'

const schema = z.object({
  duration_bucket: z.enum(['half', 'full', 'overnight'], {
    error: '소요시간을 선택해 주세요.',
  }),
  time_of_day: z.enum(['day', 'night', 'any']).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  include_visited: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { recommendations, reason } = await recommendActivities(supabase, result.data)

    const { data: log } = await supabase
      .from('recommendations_log')
      .insert({
        track: 'activity',
        recommend_type: 'quick',
        input_filters: result.data,
        recommended_ids: recommendations.map((r) => r.id),
      })
      .select('id')
      .single()

    return NextResponse.json({ recommendations, reason, log_id: log?.id ?? null })
  } catch (err) {
    console.error('[POST /api/recommend/activity]', err)
    return NextResponse.json({ error: '추천 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
