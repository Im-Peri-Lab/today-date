/**
 * Next 14 instrumentation 훅 — 서버·엣지 런타임에서 Sentry 를 초기화한다.
 * (Next 14 에는 onRequestError 가 없다. 서버 오류는 Sentry 의 자동 래핑 + src/lib/observability.ts 로 수집한다.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
