import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActivityById } from '@/lib/data/activities'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isValidReferenceUrl } from '@/lib/url'

const patchSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100).optional(),
  category_id: z.string().uuid().optional().nullable(),
  duration_bucket: z.enum(['half', 'full', 'overnight']).optional(),
  time_of_day: z.enum(['day', 'night', 'any']).optional(),
  location: z.string().max(200).optional().nullable(),
  memo: z.string().max(1000).optional().nullable(),
  reference_url: z.string().refine(isValidReferenceUrl, '올바른 URL 형식이 아닙니다.').optional().nullable().or(z.literal('')),
  status: z.enum(['wishlist', 'visited', 'archived']).optional(),
  visited_at: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  review_note: z.string().optional().nullable(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const data = await getActivityById(id)
    if (!data) return NextResponse.json({ error: '활동을 찾을 수 없습니다.' }, { status: 404 })
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/activities/[id]]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const body = await req.json()
    const result = patchSchema.safeParse(body)
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.'
      return NextResponse.json({ error: message, details: result.error.issues }, { status: 400 })
    }

    const payload = { ...result.data }
    if (payload.reference_url === '') payload.reference_url = null

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('activities')
      .update(payload)
      .eq('id', id)
      .select('*, category:activity_categories(id,name,icon,color)')
      .single()

    if (error) {
      return NextResponse.json({ error: '활동을 찾을 수 없습니다.' }, { status: 404 })
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
      return NextResponse.json({ error: '활동을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/activities/[id]]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
