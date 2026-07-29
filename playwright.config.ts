import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import { E2E_BASE_URL, E2E_PORT, E2E_SESSION_SECRET } from './e2e/helpers/env'

// 이 실행 환경에서 사전 설치된 Chromium 경로(PLAYWRIGHT_BROWSERS_PATH). 표준 `playwright install`
// 환경(로컬/일반 CI)에는 없을 수 있으므로 존재할 때만 사용한다.
const PREINSTALLED_CHROMIUM = `${process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers'}/chromium`

// DB(Supabase) 없이도 안정적으로 돌 수 있도록: 위저드 페이지가 필요로 하는 API 응답은
// 브라우저 레벨에서 mocking하고(e2e/helpers/mocks.ts), 인증 쿠키는 e2e/helpers/auth.ts가
// iron-session으로 직접 발급한다. next start에 넘기는 아래 env는 실제로 호출되지 않는
// 더미 값 — getSupabaseClient()는 지연 생성이라 mocking되지 않은 요청이 없는 한 만들어지지 않는다.
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
  webServer: {
    command: `npm run build && npm run start -- -p ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      SESSION_SECRET: E2E_SESSION_SECRET,
      SUPABASE_URL: 'https://e2e-unused.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'e2e-unused-service-role-key',
      NEXT_PUBLIC_APP_URL: E2E_BASE_URL,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 이 실행 환경에는 Chromium이 사전 설치되어 있고 @playwright/test가 기대하는 리비전과
        // 다를 수 있어(재다운로드 불가) 사전 설치 바이너리를 직접 가리킨다. 로컬/CI에
        // `playwright install`로 받은 표준 배치라면 이 경로가 없을 수 있으니 존재할 때만 사용한다.
        launchOptions: existsSync(PREINSTALLED_CHROMIUM)
          ? { executablePath: PREINSTALLED_CHROMIUM }
          : {},
      },
    },
  ],
})
