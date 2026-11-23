import type { BrowserOptions, NodeOptions } from '@sentry/nextjs'
import { scrubBreadcrumb, scrubEvent } from './scrub'

/**
 * 클라이언트·서버·엣지 세 초기화가 공유하는 Sentry 옵션.
 *
 * - DSN 이 없으면 enabled:false — 로컬 테스트·CI·E2E 는 아무것도 보내지 않고 조용히 꺼진다.
 * - environment 는 VERCEL_ENV(next.config 가 빌드 시점에 NEXT_PUBLIC_SENTRY_ENVIRONMENT 로 주입).
 * - tracesSampleRate: production 만 0.1. 둘만 쓰는 저트래픽 앱이라 10% 로도 느린 요청 패턴을 보기에
 *   충분하고, 무료(Developer) 플랜의 월 span 한도를 넘기지 않는다. 오류 수집은 이 값과 무관하게 100%.
 *   preview·development 는 0 — 오류 확인만 하면 되고 한도를 쓸 이유가 없다.
 */
export function sentryOptions(): BrowserOptions & NodeOptions {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || undefined
  const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development'
  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    sendDefaultPii: false,
    tracesSampleRate: environment === 'production' ? 0.1 : 0,
    beforeSend: event => scrubEvent(event),
    beforeSendTransaction: event => scrubEvent(event as never) as never,
    beforeBreadcrumb: scrubBreadcrumb,
  }
}
