// E2E 전용 고정값 — 실제 배포 비밀값과 무관, DB 없이 서버를 띄우기 위한 더미 설정.
export const E2E_PORT = 3100
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`
// iron-session 요구 최소 길이(32자) 충족용 더미 시크릿. playwright.config.ts의 webServer.env와
// helpers/auth.ts가 이 값을 공유해야 세션 쿠키를 서버가 그대로 복호화할 수 있다.
export const E2E_SESSION_SECRET = 'e2e-only-fixed-session-secret-not-for-any-real-deployment-use'
