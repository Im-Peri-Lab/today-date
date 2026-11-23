import { beforeEach, describe, expect, it, vi } from 'vitest'

/** reportError/logError 를 어느 호출부가 어떤 조건에서 부르는지 — 실패 보고 분류의 회귀 방지. */

const reportError = vi.fn()
const logError = vi.fn()
vi.mock('@/lib/observability', () => ({
  reportError: (...a: unknown[]) => reportError(...a),
  logError: (...a: unknown[]) => logError(...a),
}))

let insertResult: { data: unknown; error: { code?: string; message: string } | null }
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      insert: () => ({ select: () => ({ single: async () => insertResult }) }),
    }),
  }),
}))

const sendEmail = vi.fn()
const getUserByEmail = vi.fn()
vi.mock('@/lib/auth/couple', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/auth/couple')>()),
  getUserByEmail: (...a: unknown[]) => getUserByEmail(...a),
}))
vi.mock('@/lib/auth/tokens', () => ({ createToken: async () => 'raw-token' }))

import { addCoupleUser } from '@/lib/auth/couple'

beforeEach(() => {
  reportError.mockReset()
  logError.mockReset()
  sendEmail.mockReset()
  getUserByEmail.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('addCoupleUser', () => {
  it('23505(unique 충돌)는 logError 만 — Sentry 로 보내지 않는다', async () => {
    insertResult = { data: null, error: { code: '23505', message: 'duplicate key' } }
    expect(await addCoupleUser('c1', 'a@example.com', true)).toBeNull()
    expect(logError).toHaveBeenCalledTimes(1)
    expect(reportError).not.toHaveBeenCalled()
  })

  it('그 외 DB 오류는 reportError', async () => {
    insertResult = { data: null, error: { code: '08006', message: 'connection failure' } }
    expect(await addCoupleUser('c1', 'a@example.com', true)).toBeNull()
    expect(reportError).toHaveBeenCalledTimes(1)
    expect(logError).not.toHaveBeenCalled()
  })
})

describe('sendEmail — RESEND_FROM_EMAIL 미설정', () => {
  it('설정 오류이므로 reportError 를 부르고 실패를 돌려준다', async () => {
    vi.stubEnv('RESEND_FROM_EMAIL', '')
    const { sendEmail: realSendEmail } = await import('@/lib/email/resend')
    const result = await realSendEmail({ to: 'a@example.com', subject: 's', html: 'h' })
    expect(result.success).toBe(false)
    expect(reportError).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
  })
})

describe('POST /api/auth/forgot', () => {
  it('메일 발송이 실패하면 reportError — 응답은 열거 방지로 여전히 success', async () => {
    vi.doMock('@/lib/email/resend', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }))
    getUserByEmail.mockResolvedValue({ email_verified: true })
    sendEmail.mockResolvedValue({ success: false, error: 'rate limited' })
    const { POST } = await import('@/app/api/auth/forgot/route')
    const { NextRequest } = await import('next/server')

    const res = await POST(
      new NextRequest('http://localhost/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@example.com' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(reportError).toHaveBeenCalledTimes(1)
    expect(reportError.mock.calls[0][0]).toContain('/api/auth/forgot')
  })

  it('발송이 성공하면 보고하지 않는다', async () => {
    getUserByEmail.mockResolvedValue({ email_verified: true })
    sendEmail.mockResolvedValue({ success: true })
    const { POST } = await import('@/app/api/auth/forgot/route')
    const { NextRequest } = await import('next/server')
    await POST(
      new NextRequest('http://localhost/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@example.com' }),
      })
    )
    expect(reportError).not.toHaveBeenCalled()
  })
})
