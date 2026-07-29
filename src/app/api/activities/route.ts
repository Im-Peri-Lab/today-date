import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { readJsonBody, zodErrorResponse } from '@/lib/api/validation'
import {
  apiTitleSchema,
  apiCategoryIdSchema,
  apiLocationSchema,
  apiMemoSchema,
  apiReferenceUrlSchema,
  apiListQueryBase,
  splitCommaIds,
} from '@/lib/schemas/apiFields'

const createSchema = z.object({
  title: apiTitleSchema,
  category_id: apiCategoryIdSchema,
  location_type: z.enum(['indoor', 'outdoor'], {
    error: '실내/실외를 선택해 주세요.',
  }),
  duration_bucket: z.enum(['half', 'full', 'overnight'], {
    error: '소요시간을 선택해 주세요.',
  }),
  time_of_day: z.enum(['day', 'night', 'any']).optional().default('any'),
  location: apiLocationSchema,
  memo: apiMemoSchema,
  reference_url: apiReferenceUrlSchema,
})

const listQuerySchema = z.object({
  ...apiListQueryBase,
  duration_bucket: z.enum(['half', 'full', 'overnight']).optional(),
  time_of_day: z.enum(['day', 'night', 'any']).optional(),
  location_type: z.enum(['indoor', 'outdoor']).optional(),
})

async function getDefaultCategoryId(supabase: ReturnType<typeof getSupabaseClient>) {
  const { data } = await supabase
    .from('activity_categories')
    .select('id')
    .eq('name', '미분류')
    .single()
  return data?.id ?? null
}

export async function GET(req: NextRequest) {
  try {
    const parsedQuery = listQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams)
    )
    if (!parsedQuery.success) return zodErrorResponse(parsedQuery.error)
    const { status, category_id, duration_bucket, time_of_day, location_type, q } =
      parsedQuery.data

    const supabase = getSupabaseClient()
    let query = supabase
      .from('activities')
      .select('*, category:activity_categories(id,name,icon,color)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    const ids = splitCommaIds(category_id)
    if (ids.length > 1) query = query.in('category_id', ids)
    else if (ids.length === 1) query = query.eq('category_id', ids[0])
    if (duration_bucket) query = query.eq('duration_bucket', duration_bucket)
    if (time_of_day) query = query.eq('time_of_day', time_of_day)
    if (location_type) query = query.eq('location_type', location_type)
    if (q) {
      const term = q.replace(/[%,]/g, ' ')
      query = query.or(`title.ilike.%${term}%,memo.ilike.%${term}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/activities]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok) return bodyResult.response
    const result = createSchema.safeParse(bodyResult.body)
    if (!result.success) return zodErrorResponse(result.error)

    const supabase = getSupabaseClient()
    const payload = { ...result.data }

    if (!payload.category_id) {
      payload.category_id = await getDefaultCategoryId(supabase)
    }

    // 빈 문자열 URL 처리
    if (payload.reference_url === '') payload.reference_url = null

    const { data, error } = await supabase
      .from('activities')
      .insert(payload)
      .select('*, category:activity_categories(id,name,icon,color)')
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/activities]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
