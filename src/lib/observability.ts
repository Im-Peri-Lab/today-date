import * as Sentry from '@sentry/nextjs'

/**
 * 서버 오류 보고의 단일 진입점.
 *
 * API 라우트는 catch 에서 오류를 삼키고 500 JSON 을 돌려주므로 Sentry 자동 계측이 보지 못한다.
 * 그래서 기존 `console.error('[GET /api/x]', err)` 자리를 이 함수로 바꿔 한 곳에서 로그 + 수집한다.
 * Vercel 로그에는 예전과 똑같이 남는다. DSN 이 없으면 captureException 은 아무 일도 하지 않는다.
 *
 * tag 는 `[GET /api/places]` 형태 그대로 쓴다 — Sentry 에서 route 태그로 검색한다.
 */
export function reportError(tag: string, err: unknown, extra?: Record<string, unknown>): void {
  console.error(tag, err)
  try {
    Sentry.captureException(err, { tags: { route: tag }, extra })
  } catch {
    // 모니터링 실패가 요청 처리를 깨뜨리면 안 된다.
  }
}
