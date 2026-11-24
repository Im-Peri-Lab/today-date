import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUserByEmail = vi.fn()
const createToken = vi.fn()
const sendEmail = vi.fn()
const reportError = vi.fn()
vi.mock('@/lib/auth/couple', () => ({
  getUserByEmail: (...a: unknown[]) => getUserByEmail(...a),
}))
vi.mock('@/lib/auth/tokens', () => ({
  createToken: (...a: unknown[]) => createToken(...a),
}))
vi.mock('@/lib/email/resend', () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}))
vi.mock('@/lib/email/templates', () => ({
  getResetPasscodeTemplate: () => '<p>reset</p>',
}))
vi.mock('@/lib/observability', () => ({
  reportError: (...a: unknown[]) => reportError(...a),
}))

import { NextRequest } from 'next/server'
import { POST } from './route'

function post(body: string) {
  return new NextRequest('http://localhost/api/auth/forgot', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  getUserByEmail.mockReset()
  createToken.mockReset()
  sendEmail.mockReset()
  reportError.mockReset()
})

describe('POST /api/auth/forgot', () => {
  it('깨진 JSON 은 400 이고 Sentry 로 보내지 않는다', async () => {
    const res = await POST(post('{not json'))
    expect(res.status).toBe(400)
    expect(getUserByEmail).not.toHaveBeenCalled()
    expect(reportError).not.toHaveBeenCalled()
  })

  it('스키마 실패는 사용자 열거 방지로 success', async () => {
    const res = await POST(post(JSON.stringify({ email: 'nope' })))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(getUserByEmail).not.toHaveBeenCalled()
  })

  it('미가입 이메일은 success 이고 토큰·메일을 만들지 않는다', async () => {
    getUserByEmail.mockResolvedValue(null)
    const res = await POST(post(JSON.stringify({ email: 'a@example.com' })))
    expect(await res.json()).toEqual({ success: true })
    expect(createToken).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
    expect(reportError).not.toHaveBeenCalled()
  })

  it('미인증 이메일은 success 이고 토큰·메일을 만들지 않는다', async () => {
    getUserByEmail.mockResolvedValue({ email_verified: false })
    const res = await POST(post(JSON.stringify({ email: 'a@example.com' })))
    expect(await res.json()).toEqual({ success: true })
    expect(createToken).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('인증된 이메일은 토큰 생성 후 메일을 보낸다', async () => {
    getUserByEmail.mockResolvedValue({ email_verified: true })
    createToken.mockResolvedValue('tok')
    sendEmail.mockResolvedValue({ success: true })
    const res = await POST(post(JSON.stringify({ email: 'a@example.com' })))
    expect(await res.json()).toEqual({ success: true })
    expect(createToken).toHaveBeenCalledWith('reset_passcode', 'a@example.com', 30)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(reportError).not.toHaveBeenCalled()
  })

  it('getUserByEmail 예외는 reportError 후 500', async () => {
    const err = new Error('db down')
    getUserByEmail.mockRejectedValue(err)
    const res = await POST(post(JSON.stringify({ email: 'a@example.com' })))
    expect(res.status).toBe(500)
    expect(reportError).toHaveBeenCalledTimes(1)
    expect(reportError.mock.calls[0][1]).toBe(err)
  })

  it('createToken 예외는 reportError 후 500', async () => {
    getUserByEmail.mockResolvedValue({ email_verified: true })
    createToken.mockRejectedValue(new Error('token fail'))
    const res = await POST(post(JSON.stringify({ email: 'a@example.com' })))
    expect(res.status).toBe(500)
    expect(reportError).toHaveBeenCalledTimes(1)
  })
})
