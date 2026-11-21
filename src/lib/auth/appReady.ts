/**
 * app-ready 쿠키 — 미들웨어의 "설정 완료" 판정 캐시(§ src/middleware.ts).
 *
 * 값이 '1' 이면 미들웨어는 couples/users 조회(getWorkspaceStatus, 순차 DB 2회)를 건너뛰고
 * 설정 완료로 본다. 없으면 요청마다 DB 로 확인한다. 쿠키는 캐시일 뿐이라 지우는 것은
 * 언제나 안전하고(다음 요청에서 DB 로 다시 판정), 심는 것은 설정 완료가 확정된 응답에서만 한다.
 *
 * 심는 곳(설정 완료가 확정되는 성공 응답):
 *   - POST /api/auth/setup/passcode — 최초 설정 완료
 *   - POST /api/auth/unlock         — 잠금해제 성공(커플에 패스코드가 있고 인증된 사용자로
 *                                     세션이 발급됨 = isSetupComplete 와 같은 조건)
 * 지우는 곳:
 *   - DELETE /api/account — 재가입의 성립 조건(§ api/account/route.ts)
 *   - 미들웨어 expireSession — 세션을 믿을 수 없게 된 기기(다른 기기에서 계정 삭제 등)가
 *     낡은 캐시 때문에 /setup 에 못 들어가는 일을 막는다
 *
 * 보안 속성은 최초 도입(setup/passcode) 때 값 그대로다 — 두 발급 지점이 이 상수를 함께 쓴다.
 */
export const APP_READY_COOKIE = 'app-ready'

export const APP_READY_MAX_AGE = 30 * 24 * 60 * 60 // 30일

export const appReadyCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: APP_READY_MAX_AGE,
  path: '/',
})
