import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

/**
 * 도메인 데이터(activities / places / recommendations_log)의 커플 격리 진입점.
 *
 * 이 테이블들은 013 백필로 전 행에 couple_id 가 채워져 있지만, 라우트가 그 값을
 * 필터로 쓰지 않으면 인증만 통과한 요청이 다른 커플의 행을 읽고 쓸 수 있다.
 * 모든 도메인 라우트는 쿼리를 만들기 전에 여기서 세션의 커플을 확정한다.
 *
 * 참고: 세션 유효성은 미들웨어(src/middleware.ts)가 이미 검증하므로 여기서 401 이
 * 나오는 것은 정상 경로가 아니다. 그래도 라우트가 미들웨어 통과를 전제로
 * couple_id 를 undefined 로 쓰는 일이 없도록 이중으로 닫는다 —
 * `.eq('couple_id', undefined)` 는 필터가 사라진 전체 조회가 되므로 위험하다.
 */
export type CoupleScope =
  | { ok: true; coupleId: string }
  | { ok: false; response: NextResponse }

export async function requireCoupleScope(): Promise<CoupleScope> {
  const session = await getSession()

  if (!session.authenticated || !session.couple_id) {
    return {
      ok: false,
      response: NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 }),
    }
  }

  return { ok: true, coupleId: session.couple_id }
}
