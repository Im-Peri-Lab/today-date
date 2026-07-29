import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActivityById } from '@/lib/data/activities'
import { getSupabaseClient } from '@/lib/supabase/client'
import { readJsonBody, zodErrorResponse } from '@/lib/api/validation'
import {
  apiTitleSchema,
  apiCategoryIdSchema,
  apiLocationSchema,
  apiMemoSchema,
  apiReferenceUrlSchema,
  apiStatusSchema,
  apiVisitedAtSchema,
  apiRatingSchema,
  apiReviewNoteSchema,
} from '@/lib/schemas/apiFields'

const patchSchema = z.object({
  title: apiTitleSchema.optional(),
  category_id: apiCategoryIdSchema,
  duration_bucket: z.enum(['half', 'full', 'overnight']).optional(),
  time_of_day: z.enum(['day', 'night', 'any']).optional(),
  location_type: z.enum(['indoor', 'outdoor']).optional(),
  location: apiLocationSchema,
  memo: apiMemoSchema,
  reference_url: apiReferenceUrlSchema,
  status: apiStatusSchema,
  visited_at: apiVisitedAtSchema,
  // 방문 종료일(기간 방문) — activities 전용, places에는 없음.
  visited_end_at: z.string().optional().nullable(),
  rating: apiRatingSchema,
  review_note: apiReviewNoteSchema,
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const data = await getActivityById(id)
    if (!data) return NextResponse.json({ error: '액티비티를 찾을 수 없습니다.' }, { status: 404 })
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/activities/[id]]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok) return bodyResult.response
    const result = patchSchema.safeParse(bodyResult.body)
    if (!result.success) return zodErrorResponse(result.error)

    const payload = { ...result.data }
    if (payload.reference_url === '') payload.reference_url = null
    // 방문 기간: 종료일은 시작일 이상이어야 한다(클라·DB CHECK와 3단 방어의 서버 단).
    if (payload.visited_end_at && payload.visited_at && payload.visited_end_at < payload.visited_at) {
      return NextResponse.json({ error: '종료일은 시작일보다 빠를 수 없어요.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('activities')
      .update(payload)
      .eq('id', id)
      .select('*, category:activity_categories(id,name,icon,color)')
      .single()

    if (error) {
      return NextResponse.json({ error: '액티비티를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[PATCH /api/activities/[id]]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('activities').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: '액티비티를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/activities/[id]]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
