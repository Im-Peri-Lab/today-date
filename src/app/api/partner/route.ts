import { NextResponse } from 'next/server'
import { getSessionPartner } from '@/lib/auth/partner'

export const dynamic = 'force-dynamic'

/**
 * 세션 커플의 파트너 조회 — 삼선 메뉴가 "파트너" 항목을 그릴지 결정하는 근거다.
 *
 * 응답은 항상 자기 커플의 나머지 한 명이다. 커플 밖의 사용자는 조회 대상에
 * 들어오지 않고(couple_id 필터), 나 자신도 제외된다(§ lib/auth/partner.ts).
 * SOLO 면 partner: null — 오류가 아니라 "상대가 아직 없다"는 정상 응답이다.
 */
export async function GET() {
  try {
    const lookup = await getSessionPartner()

    if (!lookup.authenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    return NextResponse.json({ partner: lookup.partner })
  } catch (err) {
    console.error('[GET /api/partner]', err)
    return NextResponse.json({ error: '파트너 정보를 불러오지 못했습니다.' }, { status: 500 })
  }
}
