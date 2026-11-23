import { describe, expect, it } from 'vitest'
import type { ErrorEvent } from '@sentry/nextjs'
import { scrubBreadcrumb, scrubEvent, scrubTransaction, scrubUrl } from './scrub'

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

describe('scrubTransaction', () => {
  it('span·trace data 의 URL 쿼리와 query 키, 이메일을 가린다', () => {
    const event = {
      type: 'transaction',
      transaction: 'GET /invite?token=SECRET123',
      contexts: { trace: { trace_id: 't', span_id: 's', data: { 'url.query': 'token=SECRET123', 'http.target': '/x?email=a@b.com' } } },
      spans: [
        {
          span_id: 'a',
          trace_id: 't',
          start_timestamp: 0,
          description: 'GET https://db.example/rest/v1/users?email=eq.a@b.com&select=id',
          data: {
            url: 'https://db.example/rest/v1/users?email=eq.a@b.com',
            'url.full': 'https://db.example/rest/v1/users?email=eq.a@b.com',
            'http.query': '?email=eq.a@b.com',
            'http.method': 'GET',
          },
        },
      ],
    } as unknown as Parameters<typeof scrubTransaction>[0]
    const out = scrubTransaction(event)
    const json = JSON.stringify(out)
    expect(json).not.toMatch(/SECRET123|a@b\.com/)
    expect(out.spans?.[0].data?.['http.method']).toBe('GET')
    expect(out.spans?.[0].data?.url).toBe('https://db.example/rest/v1/users?email=[Filtered]')
    expect(out.spans?.[0].description).toBe('GET https://db.example/rest/v1/users?[Filtered]')
  })
})
