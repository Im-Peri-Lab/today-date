import type { Breadcrumb, ErrorEvent, Event } from '@sentry/nextjs'

/**
 * Sentry 로 나가는 이벤트에서 개인정보·비밀값을 제거한다 (sendDefaultPii: false 에 더해 한 번 더 거른다).
 *
 * 걸러내는 것 — 이메일·패스코드·토큰·쿠키·요청 본문:
 *  - request.data / cookies / headers / query_string 는 통째로 지운다. URL 의 쿼리는 값을 지운다
 *    (/invite?token=…, /reset?token=… 이 그대로 실리지 않게).
 *  - 키 이름이 민감한 값(email·passcode·password·token·secret·cookie·authorization·session)은 값을 가린다.
 *  - 문자열 값 안의 이메일 주소는 마스킹한다(오류 메시지에 섞여 들어오는 경우).
 *  - 콘솔 breadcrumb 는 버린다 — 라우트가 console.error 로 사용자 입력을 찍는 경우가 있다.
 */

const SENSITIVE_KEY = /e-?mail|pass(code|word)?|token|secret|cookie|authorization|session|otp/i
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const FILTERED = '[Filtered]'
const MAX_DEPTH = 8

function scrubString(value: string): string {
  return value.replace(EMAIL, '[email]')
}

export function scrubUrl(url: string): string {
  const [base, query] = url.split('?', 2)
  if (query === undefined) return scrubString(url)
  const keys = Array.from(new URLSearchParams(query).keys())
  return scrubString(`${base}${keys.length ? `?${keys.map(k => `${k}=${FILTERED}`).join('&')}` : ''}`)
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return scrubString(value)
  if (value === null || typeof value !== 'object') return value
  if (depth >= MAX_DEPTH) return FILTERED
  if (Array.isArray(value)) return value.map(v => scrubValue(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? FILTERED : scrubValue(v, depth + 1)
  }
  return out
}

export function scrubEvent<T extends ErrorEvent>(event: T): T {
  // 사용자 식별 정보는 아예 싣지 않는다.
  delete event.user

  if (event.request) {
    delete event.request.data
    delete event.request.cookies
    delete event.request.headers
    delete event.request.query_string
    if (event.request.url) event.request.url = scrubUrl(event.request.url)
  }

  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = scrubString(ex.value)
    }
  }
  if (event.message) event.message = scrubString(event.message)

  if (event.extra) event.extra = scrubValue(event.extra) as typeof event.extra
  if (event.contexts) event.contexts = scrubValue(event.contexts) as typeof event.contexts
  if (event.tags) event.tags = scrubValue(event.tags) as typeof event.tags
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map(b => scrubBreadcrumb(b))
      .filter((b): b is Breadcrumb => b !== null)
  }
  return event
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.category === 'console') return null
  const data = breadcrumb.data ? (scrubValue(breadcrumb.data) as Record<string, unknown>) : undefined
  if (data && typeof data.url === 'string') data.url = scrubUrl(data.url)
  if (data && typeof data.to === 'string') data.to = scrubUrl(data.to)
  if (data && typeof data.from === 'string') data.from = scrubUrl(data.from)
  return {
    ...breadcrumb,
    message: breadcrumb.message ? scrubString(breadcrumb.message) : breadcrumb.message,
    data,
  }
}

/** span·trace data 에서 URL 로 취급해 쿼리 값을 가릴 키. */
const URL_DATA_KEYS = new Set(['url', 'url.full', 'http.url', 'http.target', 'url.path', 'http.route_url'])
/** 쿼리 문자열 자체를 담는 키 — 통째로 가린다. */
const QUERY_DATA_KEYS = new Set(['url.query', 'http.query', 'query', 'url.fragment', 'http.fragment'])

function scrubSpanData(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!data) return data
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (QUERY_DATA_KEYS.has(key)) out[key] = FILTERED
    else if (URL_DATA_KEYS.has(key) && typeof value === 'string') out[key] = scrubUrl(value)
    else out[key] = SENSITIVE_KEY.test(key) ? FILTERED : scrubValue(value)
  }
  return out
}

/** span description 은 "GET https://host/path?query" 형태라 쿼리 이후를 잘라낸 뒤 이메일을 마스킹한다. */
function scrubDescription(description: string): string {
  return scrubString(description.replace(/\?\S*/g, `?${FILTERED}`))
}

/** 성능 추적(transaction) 이벤트용 — scrubEvent 에 더해 span·trace data 의 URL·쿼리를 거른다. */
export function scrubTransaction<T extends Event>(event: T): T {
  scrubEvent(event as unknown as ErrorEvent)
  if (event.transaction) event.transaction = scrubUrl(event.transaction)
  const trace = event.contexts?.trace
  if (trace?.data) trace.data = scrubSpanData(trace.data) as typeof trace.data
  if (event.spans) {
    for (const span of event.spans) {
      span.data = scrubSpanData(span.data) as typeof span.data
      if (span.description) span.description = scrubDescription(span.description)
    }
  }
  return event
}
