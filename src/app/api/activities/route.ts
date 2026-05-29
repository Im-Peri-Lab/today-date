import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'

const createSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하로 입력해 주세요.'),
  category_id: z.string().uuid().optional().nullable(),
  duration_bucket: z.enum(['half', 'full', 'overnight'], {
    error: '소요시간을 선택해 주세요.',
  }),
  time_of_day: z.enum(['day', 'night', 'any']).optional().default('any'),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해 주세요.').optional().nullable(),
  reference_url: z.string().url('올바른 URL 형식이 아닙니다.').optional().nullable().or(z.literal('')),
  added_by: z.string().optional().nullable(),
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
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? 'wishlist'
    const category_id = searchParams.get('category_id')
    const duration_bucket = searchParams.get('duration_bucket')
    const time_of_day = searchParams.get('time_of_day')
    const q = searchParams.get('q')

    const supabase = getSupabaseClient()
    let query = supabase
      .from('activities')
      .select('*, category:activity_categories(id,name,icon,color)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (category_id) query = query.eq('category_id', category_id)
    if (duration_bucket) query = query.eq('duration_bucket', duration_bucket)
    if (time_of_day) query = query.eq('time_of_day', time_of_day)
    if (q) query = query.ilike('memo', `%${q}%`)

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
