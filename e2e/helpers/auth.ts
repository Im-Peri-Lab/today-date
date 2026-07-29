import { sealData } from 'iron-session'
import { E2E_BASE_URL, E2E_SESSION_SECRET } from './env'

/**
 * 실제 패스코드 로그인(/api/auth/unlock)은 Supabase의 app_config 테이블을 조회하므로
 * DB 없이는 탈 수 없다. 대신 middleware.ts/getSession()이 읽는 today-date-session 쿠키를
 * iron-session의 sealData로 직접 생성해 주입한다 — 로그인 화면을 거치지 않고도 서버가
 * 신뢰하는 것과 동일한 인증 쿠키를 만든다.
 *
 * sessionVersion 필드는 의도적으로 생략한다: middleware.ts는 sessionVersion이 undefined가
 * 아닐 때만 Supabase에서 session_version을 비교 조회하므로, 생략하면 그 조회 자체가 필요 없어진다.
 *
 * app-ready 쿠키는 middleware.ts가 "설정 완료 여부"를 Supabase 조회 없이 캐시로 판단하게 하는
 * 값이다 — 이것도 없으면 모든 요청이 setup 완료 확인을 위해 Supabase를 조회한다.
 */
export async function authCookies() {
  const sealed = await sealData(
    { authenticated: true, lastVerifiedAt: Date.now() },
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
