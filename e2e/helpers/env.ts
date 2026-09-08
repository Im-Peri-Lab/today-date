// E2E 전용 고정값 — 실제 배포 비밀값과 무관.
export const E2E_PORT = 3100
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`

/**
 * PostgREST 스텁(e2e/stub/server.mjs)이 듣는 포트. Next 서버의 SUPABASE_URL 이 여기를 가리켜
 * 실제 라우트 코드가 진짜 HTTP 로 "DB"에 붙는다. 포트를 고정해 두는 이유는 두 서버의
 * 기동 순서에 무관해지기 위함이다 — 동적 포트라면 Next 가 스텁 주소를 모른 채 떠야 한다.
 */
export const E2E_STUB_PORT = 3200
export const E2E_STUB_URL = `http://127.0.0.1:${E2E_STUB_PORT}`

// iron-session 요구 최소 길이(32자) 충족용 더미 시크릿. playwright.config.ts의 webServer.env와
// helpers/auth.ts가 이 값을 공유해야 세션 쿠키를 서버가 그대로 복호화할 수 있다.
export const E2E_SESSION_SECRET = 'e2e-only-fixed-session-secret-not-for-any-real-deployment-use'
