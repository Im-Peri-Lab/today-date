import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPlaceById } from '@/lib/data/places'
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
  area: z.string().min(1).optional(),
  location: apiLocationSchema,
  meal_times: z.array(z.enum(['lunch', 'dinner'])).min(1).max(2).optional(),
  memo: apiMemoSchema,
  reference_url: apiReferenceUrlSchema,
  status: apiStatusSchema,
  visited_at: apiVisitedAtSchema,
  rating: apiRatingSchema,
  review_note: apiReviewNoteSchema,
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const data = await getPlaceById(id)
    if (!data) return NextResponse.json({ error: '다이닝을 찾을 수 없습니다.' }, { status: 404 })
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/places/[id]]', err)
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

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('places')
      .update(payload)
      .eq('id', id)
      .select('*, category:place_categories(id,name,icon,color)')
      .single()

    if (error) {
      return NextResponse.json({ error: '다이닝을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[PATCH /api/places/[id]]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('places').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: '다이닝을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/places/[id]]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
