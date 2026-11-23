import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendPartnerInvite = vi.fn()
vi.mock('@/lib/auth/coupleScope', () => ({
  requireCoupleScope: async () => ({ ok: true, coupleId: 'couple-1' }),
}))
vi.mock('@/lib/auth/invite', () => ({
  sendPartnerInvite: (...a: unknown[]) => sendPartnerInvite(...a),
}))
const reportError = vi.fn()
vi.mock('@/lib/observability', () => ({
  reportError: (...a: unknown[]) => reportError(...a),
}))

import { NextRequest } from 'next/server'
import { POST } from './route'

function post(body: string) {
  return new NextRequest('http://localhost/api/auth/invite', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  sendPartnerInvite.mockReset()
  reportError.mockReset()
})

describe('POST /api/auth/invite', () => {
  it('깨진 JSON 은 400 이고 Sentry 로 보내지 않는다', async () => {
    const res = await POST(post('{not json'))
    expect(res.status).toBe(400)
    expect(sendPartnerInvite).not.toHaveBeenCalled()
    expect(reportError).not.toHaveBeenCalled()
  })

  it('이메일 형식이 틀리면 400', async () => {
    const res = await POST(post(JSON.stringify({ email: 'nope' })))
    expect(res.status).toBe(400)
  })

  it('server_error 는 500 이고 reportError 를 부른다', async () => {
    sendPartnerInvite.mockResolvedValue({ ok: false, reason: 'server_error' })
    const res = await POST(post(JSON.stringify({ email: 'a@example.com' })))
    expect(res.status).toBe(500)
    expect(reportError).toHaveBeenCalledTimes(1)
  })

  it('already_registered 는 409 이고 Sentry 로 보내지 않는다', async () => {
    sendPartnerInvite.mockResolvedValue({ ok: false, reason: 'already_registered' })
    const res = await POST(post(JSON.stringify({ email: 'a@example.com' })))
    expect(res.status).toBe(409)
    expect(reportError).not.toHaveBeenCalled()
  })
})
