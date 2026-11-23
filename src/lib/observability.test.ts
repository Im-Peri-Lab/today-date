import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureException(...a) }))

import { logError, reportError } from './observability'

beforeEach(() => {
  captureException.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('reportError / logError', () => {
  it('Error 는 그대로 보내고 route 태그를 붙인다', () => {
    const err = new Error('boom')
    reportError('[GET /api/x]', err)
    expect(captureException).toHaveBeenCalledWith(err, { tags: { route: '[GET /api/x]' }, extra: undefined })
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
