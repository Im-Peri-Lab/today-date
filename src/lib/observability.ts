import * as Sentry from '@sentry/nextjs'

/**
 * 서버 오류 보고의 단일 진입점.
 *
 * API 라우트는 catch 에서 오류를 삼키고 500 JSON 을 돌려주므로 Sentry 자동 계측이 보지 못한다.
 * 그래서 기존 `console.error('[GET /api/x]', err)` 자리를 이 두 함수로 바꿔 한 곳에서 다룬다.
 *
 * - reportError : 로그 + Sentry 전송. 5xx·실제 실패(DB 오류, 이메일 발송 실패 등)에만 쓴다.
 * - logError    : 로그만. 409 같은 "의도한 거절"(already_registered, unique 충돌 등)은
 *                 장애가 아니므로 Sentry 이슈로 만들지 않는다.
 *
 * DSN 이 없으면 captureException 은 아무 일도 하지 않는다. tag 는 `[GET /api/places]` 형태 그대로 쓴다 —
 * Sentry 에서 route 태그로 검색한다.
 */

export function logError(tag: string, err: unknown): void {
  console.error(tag, err)
}

export function reportError(tag: string, err: unknown, extra?: Record<string, unknown>): void {
  console.error(tag, err)
  try {
    // Error 가 아닌 값(문자열, PostgrestError 같은 객체)은 Error(tag) 로 감싸 스택·그룹핑을 확보하고,
    // 원래 값은 extra.original 로 싣는다 — beforeSend 의 scrub 이 이메일·민감 키를 거른다.
    const isError = err instanceof Error
    Sentry.captureException(isError ? err : new Error(tag), {
      tags: { route: tag },
      // 같은 reportError 안에서 만든 오류는 스택이 같아 Sentry 가 서로 다른 지점의 오류를 한 이슈로 묶는다.
      // tag(라우트·쿼리 이름)를 fingerprint 에 더해 지점별로 이슈를 나눈다.
      fingerprint: ['{{ default }}', tag],
      extra: isError ? extra : { ...extra, original: err },
    })
  } catch {
    // 모니터링 실패가 요청 처리를 깨뜨리면 안 된다.
  }
}

/**
 * 오류 경계(error.tsx·global-error.tsx)용 클라이언트 보고.
 *
 * 서버 컴포넌트가 던진 오류는 서버에서 이미 원래 메시지로 수집된다(Sentry 의 서버 컴포넌트 자동 래핑).
 * 클라이언트에 도착하는 같은 오류는 프로덕션에서 메시지가 가려지고 `digest` 만 남아 중복 이슈가 될 뿐이므로
 * digest 가 있으면 보내지 않는다. digest 가 없는 오류는 브라우저에서 난 것이라 서버가 모른다 — 그대로 보낸다.
 */
export function reportBoundaryError(error: Error & { digest?: string }, boundary: string): void {
  if (error.digest) return
  try {
    Sentry.captureException(error, { tags: { boundary } })
  } catch {
    // 모니터링 실패가 오류 화면을 깨뜨리면 안 된다.
  }
}
