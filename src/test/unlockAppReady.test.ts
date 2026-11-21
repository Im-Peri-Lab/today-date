// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createFakeSupabase, type FakeDb } from './fakeSupabase'

/**
 * POST /api/auth/unlock — app-ready 쿠키 발급 계약.
 *
 * 잠금해제 성공은 isSetupComplete 와 같은 조건(커플에 패스코드 + 인증된 사용자로 세션 발급)
 * 이므로 설정 완료 캐시를 심는다(§ lib/auth/appReady.ts). 실패·이메일 확인 분기에서는
 * 세션이 발급되지 않으므로 심지 않는다. 보안 속성은 최초 설정(setup/passcode)과 같아야 한다.
 */

const COUPLE = '11111111-1111-4111-8111-111111111111'
const USER_A = '33333333-3333-4333-8333-333333333333'
const USER_B = '44444444-4444-4444-8444-444444444444'

let db: FakeDb
const session = {
  authenticated: false,
  save: async () => {},
} as Record<string, unknown>

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => createFakeSupabase(db),
}))
vi.mock('@/lib/auth/session', () => ({
  getSession: async () => session,
}))
vi.mock('@/lib/auth/passcode', () => ({
  verifyPasscode: async (passcode: string) => passcode === '123456',
}))
vi.mock('@/lib/auth/deviceUser', () => ({
  DEVICE_USER_COOKIE: 'today-date-device-user',
  DEVICE_USER_MAX_AGE: 365 * 24 * 60 * 60,
  readDeviceUser: async () => null,
  sealDeviceUser: async () => 'sealed-device',
}))
vi.mock('@/lib/auth/pendingUser', () => ({
  PENDING_USER_COOKIE: 'today-date-pending-user',
  readPendingUser: async () => null,
}))

import { POST as unlock } from '@/app/api/auth/unlock/route'

function seed(users: number): FakeDb {
  const rows = [
    { id: USER_A, couple_id: COUPLE, email: 'a@example.com', email_verified: true, created_at: '2026-01-01' },
    { id: USER_B, couple_id: COUPLE, email: 'b@example.com', email_verified: true, created_at: '2026-01-02' },
  ].slice(0, users)
  return {
    couples: [
      {
        id: COUPLE, passcode_hash: 'hash', failed_attempts: 0, locked_until: null,
        session_version: 1, created_at: '2026-01-01',
      },
    ],
    users: rows,
  }
}

function req(body: unknown) {
  return new NextRequest('http://localhost/api/auth/unlock', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function appReadyCookie(res: Response): string | undefined {
  return res.headers.getSetCookie().find((c) => c.startsWith('app-ready='))
}

beforeEach(() => {
  db = seed(1)
})

describe('POST /api/auth/unlock — app-ready', () => {
  it('잠금해제에 성공하면 app-ready=1 을 기존과 같은 속성으로 심는다', async () => {
    const res = await unlock(req({ passcode: '123456' }))
    expect(res.status).toBe(200)

    const cookie = appReadyCookie(res)
    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/^app-ready=1;/)
    expect(cookie).toMatch(/Max-Age=2592000/)
    expect(cookie).toMatch(/Path=\//)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=lax/i)
  })

  it('패스코드가 틀리면 심지 않는다', async () => {
    const res = await unlock(req({ passcode: '000000' }))
    expect(res.status).toBe(401)
    expect(appReadyCookie(res)).toBeUndefined()
  })

  it('PAIRED 에서 누구인지 물어야 할 때(409)도 세션이 없으므로 심지 않는다', async () => {
    db = seed(2)
    const res = await unlock(req({ passcode: '123456' }))
    expect(res.status).toBe(409)
    expect(appReadyCookie(res)).toBeUndefined()
  })

  it('설정이 끝나지 않은 커플(패스코드 없음)은 403 이고 심지 않는다', async () => {
    db.couples[0].passcode_hash = null
    const res = await unlock(req({ passcode: '123456' }))
    expect(res.status).toBe(403)
    expect(appReadyCookie(res)).toBeUndefined()
  })
})
