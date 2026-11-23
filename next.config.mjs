import { withSentryConfig } from '@sentry/nextjs/config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // 클라이언트 번들에서도 environment 를 알 수 있게 빌드 시점의 VERCEL_ENV 를 주입한다.
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.VERCEL_ENV ?? 'development',
  },
}

const hasAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN)

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // 토큰이 없으면(로컬·CI·E2E) 소스맵 업로드만 건너뛰고 빌드는 그대로 성공한다.
  sourcemaps: {
    disable: !hasAuthToken,
    // 업로드 후 .map 파일을 삭제해 공개 번들에서 소스맵을 숨긴다.
    deleteSourcemapsAfterUpload: true,
  },
  silent: !process.env.CI,
  telemetry: false,
  webpack: { treeshake: { removeDebugLogging: true } },
})
