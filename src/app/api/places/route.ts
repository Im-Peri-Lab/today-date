import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { requireCoupleScope } from '@/lib/auth/coupleScope'
import { orderByListRule } from '@/lib/data/listOrder'
import { readJsonBody, zodErrorResponse } from '@/lib/api/validation'
import {
  apiTitleSchema,
  apiCategoryIdSchema,
  apiLocationSchema,
  apiMemoSchema,
  apiReferenceUrlSchema,
  apiPlannedAtSchema,
  apiPlannedTimeSchema,
  applyPlannedTimeRule,
  apiListQueryBase,
  splitCommaIds,
} from '@/lib/schemas/apiFields'

const createSchema = z.object({
  title: apiTitleSchema,
  category_id: apiCategoryIdSchema,
  area: z.string().min(1, '지역을 입력해 주세요.'),
  location: apiLocationSchema,
  meal_times: z
    .array(z.enum(['lunch', 'dinner']))
    .min(1, '식사 시간을 하나 이상 선택해 주세요.')
    .max(2),
  memo: apiMemoSchema,
  reference_url: apiReferenceUrlSchema,
  planned_at: apiPlannedAtSchema,
  planned_time: apiPlannedTimeSchema,
})

const listQuerySchema = z.object({
  ...apiListQueryBase,
  area: z.string().optional(),
  meal_time: z.enum(['lunch', 'dinner']).optional(),
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
    const parsedQuery = listQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams)
    )
    if (!parsedQuery.success) return zodErrorResponse(parsedQuery.error)
    const { status, category_id, area, meal_time, q, planned_only } = parsedQuery.data

    const scope = await requireCoupleScope()
    if (!scope.ok) return scope.response

    const supabase = getSupabaseClient()
    let query = supabase
      .from('places')
      .select('*, category:place_categories(id,name,icon,color)')
      .eq('couple_id', scope.coupleId)
      .eq('status', status)

    // 다녀온 곳: 다녀온 날짜 최신순, 같으면 마지막 수정 최신순 / 그 외: 등록 최신순.
    // 규칙은 홈 대시보드 미리보기와 공유한다(§ lib/data/listOrder.ts).
    // 방문예정만(위시리스트 전용): 예정일 있는 행만 + 임박순.
    const plannedOnly = status === 'wishlist' && planned_only === 'true'
    query = orderByListRule(query, status, plannedOnly)
    if (plannedOnly) query = query.not('planned_at', 'is', null)

    const ids = splitCommaIds(category_id)
    if (ids.length > 1) query = query.in('category_id', ids)
    else if (ids.length === 1) query = query.eq('category_id', ids[0])
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
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok) return bodyResult.response
    const result = createSchema.safeParse(bodyResult.body)
    if (!result.success) return zodErrorResponse(result.error)
    // 날짜·시간 짝 규칙(021) — 날짜 지우기면 시간도 지우고, 날짜 없이 시간만 오면 거부.
    const paired = applyPlannedTimeRule(result.data)
    if (!paired.ok) return NextResponse.json({ error: paired.error }, { status: 400 })

    const scope = await requireCoupleScope()
    if (!scope.ok) return scope.response

    const supabase = getSupabaseClient()
    // 소유자는 세션값으로만 정한다 — 사유는 POST /api/activities 주석 참고.
    const payload = { ...paired.data, couple_id: scope.coupleId }

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
