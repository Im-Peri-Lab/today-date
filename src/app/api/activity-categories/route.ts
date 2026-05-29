import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('activity_categories')
      .select('id,name,icon,color,sort_order,is_default,is_hidden,created_at')
      .eq('is_hidden', false)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/activity-categories]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
