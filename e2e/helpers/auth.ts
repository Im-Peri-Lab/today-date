import { sealData } from 'iron-session'
import { E2E_BASE_URL, E2E_SESSION_SECRET } from './env'

/**
 * 실제 패스코드 로그인(/api/auth/unlock)은 Supabase의 couples/users 테이블을 조회하므로
 * DB 없이는 탈 수 없다. 대신 middleware.ts/getSession()이 읽는 today-date-session 쿠키를
 * iron-session의 sealData로 직접 생성해 주입한다 — 로그인 화면을 거치지 않고도 서버가
 * 신뢰하는 것과 동일한 인증 쿠키를 만든다.
 *
 * couple_id / user_id 는 실제 세션과 같은 형태(uuid)로 채운다. middleware.ts가 couple_id
 * 없는 쿠키를 "전환 이전 세션"으로 보고 만료 처리하므로 이 값이 없으면 모든 테스트가
 * /lock 으로 리다이렉트된다. DB에 없는 값이어도 되는 이유는 아래 sessionVersion 설명과 같다 —
 * 이 값으로 couples를 조회하는 경로 자체를 타지 않는다.
 *
 * sessionVersion 필드는 의도적으로 생략한다: middleware.ts는 sessionVersion이 undefined가
 * 아닐 때만 couple_id로 couples.session_version을 비교 조회하므로, 생략하면 그 조회 자체가
 * 필요 없어진다.
 *
 * app-ready 쿠키는 middleware.ts가 "설정 완료 여부"를 Supabase 조회 없이 캐시로 판단하게 하는
 * 값이다 — 이것도 없으면 모든 요청이 설정 완료 확인을 위해 Supabase를 조회한다.
 */

// DB에 존재하지 않아도 되는 고정 더미 uuid — 위 주석대로 조회에 쓰이지 않는다.
const E2E_COUPLE_ID = '00000000-0000-4000-8000-000000000001'
const E2E_USER_ID = '00000000-0000-4000-8000-000000000002'

export async function authCookies() {
  const sealed = await sealData(
    {
      authenticated: true,
      lastVerifiedAt: Date.now(),
      couple_id: E2E_COUPLE_ID,
      user_id: E2E_USER_ID,
    },
    { password: E2E_SESSION_SECRET }
  )
  const domain = new URL(E2E_BASE_URL).hostname

  return [
    {
      name: 'today-date-session',
      value: sealed,
      domain,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const,
    },
    {
      name: 'app-ready',
      value: '1',
      domain,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    },
  ]
}
