import { describe, expect, it } from 'vitest'
import type { ErrorEvent } from '@sentry/nextjs'
import { scrubBreadcrumb, scrubEvent, scrubUrl } from './scrub'

describe('scrubEvent', () => {
  it('요청 본문·쿠키·헤더·쿼리·사용자 정보를 제거하고 URL 쿼리 값을 가린다', () => {
    const event = {
      type: undefined,
      user: { email: 'a@b.com', ip_address: '1.2.3.4' },
      request: {
        url: 'https://x.app/invite?token=SECRET123&a=1',
        data: { email: 'a@b.com', passcode: '1234' },
        cookies: { 'today-date-session': 'abc' },
        headers: { cookie: 'x', authorization: 'Bearer y' },
        query_string: 'token=SECRET123',
      },
    } as ErrorEvent
    const out = scrubEvent(event)
    expect(out.user).toBeUndefined()
    expect(out.request?.data).toBeUndefined()
    expect(out.request?.cookies).toBeUndefined()
    expect(out.request?.headers).toBeUndefined()
    expect(out.request?.query_string).toBeUndefined()
    expect(out.request?.url).toBe('https://x.app/invite?token=[Filtered]&a=[Filtered]')
    expect(JSON.stringify(out)).not.toMatch(/SECRET123|a@b\.com|1234/)
  })

  it('메시지·예외·extra 안의 이메일을 마스킹하고 민감 키 값을 가린다', () => {
    const event = {
      type: undefined,
      message: 'fail for me@example.com',
      exception: { values: [{ value: 'duplicate key me@example.com' }] },
      extra: { email: 'me@example.com', nested: { passcode: '9999', note: 'hi you@x.io' } },
    } as ErrorEvent
    const out = scrubEvent(event)
    expect(JSON.stringify(out)).not.toMatch(/@example\.com|@x\.io|9999/)
    expect(out.exception?.values?.[0].value).toBe('duplicate key [email]')
  })
})

describe('scrubBreadcrumb', () => {
  it('console breadcrumb 는 버린다', () => {
    expect(scrubBreadcrumb({ category: 'console', message: 'x@y.com' })).toBeNull()
  })
  it('fetch breadcrumb 의 URL 쿼리를 가린다', () => {
    const b = scrubBreadcrumb({ category: 'fetch', data: { url: '/api/x?token=abc' } })
    expect(b?.data?.url).toBe('/api/x?token=[Filtered]')
  })
})

describe('scrubUrl', () => {
  it('쿼리가 없으면 그대로 둔다', () => {
    expect(scrubUrl('https://x.app/list')).toBe('https://x.app/list')
  })
})
