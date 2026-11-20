import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ServerTiming } from '@/lib/diag/serverTiming'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const st = new ServerTiming('pcat')
    const supabase = getSupabaseClient()
    const { data, error } = await st.time('db', () =>
      supabase
      .from('place_categories')
      .select('id,name,icon,color,sort_order,is_default,is_hidden,created_at')
      .eq('is_hidden', false)
      .order('sort_order', { ascending: true })
    )

    if (error) throw error
    st.total()
    return st.apply(NextResponse.json({ data }))
  } catch (err) {
    console.error('[GET /api/place-categories]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
