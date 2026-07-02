import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isValidReferenceUrl } from '@/lib/url'

const createSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하로 입력해 주세요.'),
  category_id: z.string().uuid().optional().nullable(),
  area: z.string().min(1, '지역을 입력해 주세요.'),
  location: z.string().max(200, '위치는 200자 이하로 입력해 주세요.').optional().nullable(),
  meal_times: z
    .array(z.enum(['lunch', 'dinner']))
    .min(1, '식사 시간을 하나 이상 선택해 주세요.')
    .max(2),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해 주세요.').optional().nullable(),
  reference_url: z.string().refine(isValidReferenceUrl, '올바른 URL 형식이 아닙니다.').optional().nullable().or(z.literal('')),
})

async function getDefaultCategoryId(supabase: ReturnType<typeof getSupabaseClient>) {
  const { data } = await supabase
    .from('place_categories')
    .select('id')
    .eq('name', '미분류')
    .single()
  return data?.id ?? null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? 'wishlist'
    const category_id = searchParams.get('category_id')
    const area = searchParams.get('area')
    const meal_time = searchParams.get('meal_time')
    const q = searchParams.get('q')

    const supabase = getSupabaseClient()
    let query = supabase
      .from('places')
      .select('*, category:place_categories(id,name,icon,color)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (category_id) {
      const ids = category_id.split(',').filter(Boolean)
      query = ids.length > 1 ? query.in('category_id', ids) : query.eq('category_id', ids[0])
    }
    if (area) query = query.ilike('area', `%${area}%`)
    if (meal_time) query = query.contains('meal_times', [meal_time])
    if (q) {
      const term = q.replace(/[%,]/g, ' ')
      query = query.or(`title.ilike.%${term}%,memo.ilike.%${term}%,area.ilike.%${term}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/places]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = createSchema.safeParse(body)
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.'
      return NextResponse.json({ error: message, details: result.error.issues }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const payload = { ...result.data }

    if (!payload.category_id) {
      payload.category_id = await getDefaultCategoryId(supabase)
    }

    if (payload.reference_url === '') payload.reference_url = null

    const { data, error } = await supabase
      .from('places')
      .insert(payload)
      .select('*, category:place_categories(id,name,icon,color)')
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/places]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
