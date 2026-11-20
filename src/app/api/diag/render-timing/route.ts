import { NextRequest, NextResponse } from 'next/server'
import { getCoupleById, getCoupleUsers } from '@/lib/auth/couple'
import { getSession } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/data/dashboard'
import { getPlaceById } from '@/lib/data/places'
import { ServerTiming } from '@/lib/diag/serverTiming'

export const dynamic = 'force-dynamic'

/**
 * [진단 전용 — diag/loading-server-timing, 머지 금지]
 *
 * 서버 컴포넌트(홈·장소 상세)는 Next 14 에서 응답 헤더를 쓸 수 없다. 그래서 페이지가
 * 렌더 중에 부르는 것과 같은 함수·같은 병렬 구조를 여기서 그대로 실행하고 구간별 시간을
 * Server-Timing 으로 돌려준다. 실제 렌더의 값은 Vercel Runtime Logs 의
 * `[server-timing] home-render` / `place-render` 줄로도 남는다.
 *
 *   GET /api/diag/render-timing?page=home
 *   GET /api/diag/render-timing?page=place&id=<장소 id>
 *
 * 미들웨어 보호 경로(/api/auth/ 아님)라 세션이 있어야 하고, 응답 본문에는 데이터를
 * 담지 않는다(구간 시간만 헤더로).
 */
export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page')
  const st = new ServerTiming(page === 'place' ? 'place' : 'home')

  const session = await st.time('session', () => getSession())
  if (!session.authenticated || !session.couple_id) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  const coupleId = session.couple_id

  if (page === 'place') {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 가 필요합니다.' }, { status: 400 })
    const place = await st.time('query', () => getPlaceById(id, coupleId))
    st.total()
    return st.apply(NextResponse.json({ page: 'place', found: !!place }))
  }

  // § app/(home)/page.tsx 와 같은 세 쿼리 · 같은 Promise.all
  await st.time('queries', () =>
    Promise.all([
      st.time('stats', () => getDashboardStats(coupleId)),
      st.time('getcouple', () => getCoupleById(coupleId), { counted: true }),
      st.time('users', () => getCoupleUsers(coupleId)),
    ])
  )
  st.total()
  return st.apply(NextResponse.json({ page: 'home' }))
}
