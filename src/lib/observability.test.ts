import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureException(...a) }))

import { logError, reportBoundaryError, reportError } from './observability'

beforeEach(() => {
  captureException.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('reportError / logError', () => {
  it('Error 는 그대로 보내고 route 태그를 붙인다', () => {
    const err = new Error('boom')
    reportError('[GET /api/x]', err)
    expect(captureException).toHaveBeenCalledWith(err, {
      tags: { route: '[GET /api/x]' },
      fingerprint: ['{{ default }}', '[GET /api/x]'],
      extra: undefined,
    })
  })

  it('문자열·객체는 Error(tag) 로 감싸고 원래 값을 extra.original 에 싣는다', () => {
    reportError('[tag]', { code: 'X', message: 'm' })
    const [sent, ctx] = captureException.mock.calls[0]
    expect(sent).toBeInstanceOf(Error)
    expect(sent.message).toBe('[tag]')
    expect(ctx.extra.original).toEqual({ code: 'X', message: 'm' })
    reportError('[tag2]', 'plain')
    expect(captureException.mock.calls[1][1].extra.original).toBe('plain')
  })

  it('logError 는 Sentry 로 보내지 않는다', () => {
    logError('[tag]', new Error('expected 409'))
    expect(captureException).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('fingerprint', () => {
  it('같은 스택이어도 tag 가 다르면 fingerprint 가 달라 이슈가 나뉜다', () => {
    reportError('[getDashboardStats] 미리보기 실패(위시리스트 액티비티 제목)', 'a')
    reportError('[getDashboardStats] 미리보기 실패(다녀온 다이닝 제목)', 'b')
    const [a, b] = captureException.mock.calls.map(c => c[1].fingerprint)
    expect(a).toEqual(['{{ default }}', '[getDashboardStats] 미리보기 실패(위시리스트 액티비티 제목)'])
    expect(a).not.toEqual(b)
  })
})

describe('reportBoundaryError', () => {
  it('digest 가 있으면(서버에서 이미 수집한 오류) 보내지 않는다', () => {
    reportBoundaryError(Object.assign(new Error('masked'), { digest: '123' }), 'home')
    expect(captureException).not.toHaveBeenCalled()
  })

  it('digest 가 없는 클라이언트 오류는 boundary 태그와 함께 보낸다', () => {
    const err = new Error('client only')
    reportBoundaryError(err, 'global')
    expect(captureException).toHaveBeenCalledWith(err, { tags: { boundary: 'global' } })
  })
})
