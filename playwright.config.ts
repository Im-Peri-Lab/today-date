import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import {
  E2E_BASE_URL,
  E2E_PORT,
  E2E_SESSION_SECRET,
  E2E_STUB_PORT,
  E2E_STUB_URL,
} from './e2e/helpers/env'

// 이 실행 환경에서 사전 설치된 Chromium 경로(PLAYWRIGHT_BROWSERS_PATH). 표준 `playwright install`
// 환경(로컬/일반 CI)에는 없을 수 있으므로 존재할 때만 사용한다.
const PREINSTALLED_CHROMIUM = `${process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers'}/chromium`

const launchOptions = existsSync(PREINSTALLED_CHROMIUM)
  ? { executablePath: PREINSTALLED_CHROMIUM }
  : {}

/**
 * 두 종류의 E2E 가 한 서버를 공유한다.
 *
 * 1) mocked — 위저드 네비게이션처럼 화면 상태만 보는 스펙. /api/* 응답을 브라우저에서
 *    가로채므로(e2e/helpers/mocks.ts) 서버 라우트와 DB 에 요청이 도달하지 않는다.
 * 2) db — 커플 격리·인증처럼 "서버가 무엇을 걸렀는가"가 핵심인 스펙. 브라우저 →
 *    Next 서버 → 실제 라우트 → supabase-js → PostgREST 스텁까지 전 구간이 실제 HTTP 다.
 *
 * 그래서 webServer 를 둘 띄운다: PostgREST 스텁(e2e/stub/server.mjs)과 Next 프로덕션 서버.
 * Next 의 SUPABASE_URL 이 스텁을 가리키므로 실제 DB(Supabase)에는 접속하지 않는다 —
 * CI 에서 시크릿 없이 상시 실행할 수 있다.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node e2e/stub/server.mjs',
      url: `${E2E_STUB_URL}/__control/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { STUB_PORT: String(E2E_STUB_PORT) },
    },
    {
      command: `npm run build && npm run start -- -p ${E2E_PORT}`,
      url: E2E_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        SESSION_SECRET: E2E_SESSION_SECRET,
        // 실제 Supabase 대신 스텁. 라우트·데이터 계층 코드는 그대로 실행된다.
        SUPABASE_URL: E2E_STUB_URL,
        SUPABASE_SERVICE_ROLE_KEY: 'e2e-stub-service-role-key',
        NEXT_PUBLIC_APP_URL: E2E_BASE_URL,
        /**
         * 이메일 발송을 무력화한다 — 반드시 빈 문자열로 "설정"해야 한다.
         *
         * Next 는 process.env 에 이미 있는 키는 .env.local 로 덮지 않는다. 뒤집어 말하면
         * 여기서 지정하지 않은 키는 개발자의 .env.local 값이 그대로 실린다. 실제로 이
         * 두 줄이 없을 때 가입 플로우 E2E 가 개발자의 진짜 RESEND_API_KEY 로
         * api.resend.com 에 요청을 보냈다(422 응답이 로그에 찍혔다). 테스트 실행이
         * 외부 서비스를 건드리는 것은 그 자체로 사고이므로 키를 비워 봉한다.
         *
         * RESEND_FROM_EMAIL 이 비면 sendEmail()은 네트워크 호출 전에 실패를 반환하고
         * (src/lib/email/resend.ts), send-verify 는 사용자 열거 방지를 위해 이메일
         * 실패와 무관하게 200 을 준다 — 그래서 가입 플로우는 정상 진행된다.
         */
        RESEND_FROM_EMAIL: '',
        RESEND_API_KEY: '',
      },
    },
  ],
  projects: [
    {
      // DB 를 쓰지 않는 스펙 — 병렬로 돌려도 서로 간섭이 없다.
      name: 'chromium',
      testIgnore: /db\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions },
    },
    {
      // DB(스텁)를 쓰는 스펙 — 스텁 상태가 프로세스 하나에 공유되므로 병렬 실행을 끈다.
      // 스펙을 추가할 때는 기존 파일에 넣는다: 파일이 늘면 워커가 갈라져 상태가 섞인다
      // (파일을 나눠야 한다면 스텁에 워커별 데이터셋 분리를 먼저 넣어야 한다).
      name: 'chromium-db',
      testMatch: /db\/.*\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], launchOptions },
    },
  ],
})
