import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeSupabase, type FakeDb } from './fakeSupabase'

/**
 * DELETE /api/account — 라우트 계약 검증.
 *
 * 삭제 범위·순서는 lib 계층에서 본다(§ accountDeletion.test.ts). 여기서는 라우트만의
 * 책임 세 가지를 본다:
 *   1. 커플을 세션에서만 가져오는가(본문을 읽지 않는가).
 *   2. 상태별 응답 코드가 맞는가(401 / 409 PAIRED / 404 / 200).
 *   3. 성공 시 세션과 **app-ready 쿠키**를 파기하는가.
 *
 * 3번이 특히 중요하다. app-ready 는 미들웨어가 "설정 완료"를 DB 조회 없이 단정하는
 * 캐시라, 계정이 사라졌는데 이 쿠키가 남으면 /setup 이 홈으로 되돌려져 재가입 자체가
 * 불가능해진다 — 이 기능의 목적이 무너지는 지점이므로 응답 헤더에서 직접 확인한다.
 */

const COUPLE_A = '11111111-1111-4111-8111-111111111111'
const COUPLE_B = '22222222-2222-4222-8222-222222222222'
const USER_A = '33333333-3333-4333-8333-333333333333'

let db: FakeDb
let session: {
  authenticated: boolean
  couple_id?: string
  user_id?: string
  destroy: () => void
}
let destroyed: boolean

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => createFakeSupabase(db),
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => session,
}))

import { DELETE as deleteAccount } from '@/app/api/account/route'

function seed(): FakeDb {
  return {
    couples: [
      { id: COUPLE_A, passcode_hash: 'hash-a', session_version: 1, created_at: '2026-01-01' },
      { id: COUPLE_B, passcode_hash: 'hash-b', session_version: 1, created_at: '2026-01-02' },
    ],
    users: [
      {
        id: USER_A, couple_id: COUPLE_A, email: 'a@example.com',
        email_verified: true, created_at: '2026-01-01',
      },
      {
        id: '44444444-4444-4444-8444-444444444444', couple_id: COUPLE_B,
        email: 'b@example.com', email_verified: true, created_at: '2026-01-02',
      },
    ],
    activities: [
      { id: 'act-a1', couple_id: COUPLE_A, title: 'A 액티비티', status: 'wishlist' },
      { id: 'act-b1', couple_id: COUPLE_B, title: 'B 액티비티', status: 'wishlist' },
    ],
    places: [{ id: 'plc-b1', couple_id: COUPLE_B, title: 'B 다이닝', status: 'wishlist' }],
    recommendations_log: [],
    email_tokens: [],
  }
}

/** 응답의 Set-Cookie 를 한 문자열로 — 쿠키 파기 지시를 직접 확인한다. */
function setCookieHeader(res: Response): string {
  const all = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie
  return all ? all.call(res.headers).join('\n') : (res.headers.get('set-cookie') ?? '')
}

beforeEach(() => {
  db = seed()
  destroyed = false
  session = {
    authenticated: true,
    couple_id: COUPLE_A,
    user_id: USER_A,
    destroy: () => {
      destroyed = true
    },
  }
})

describe('DELETE /api/account', () => {
  it('SOLO 세션은 200 이고 그 커플만 사라진다', async () => {
    const res = await deleteAccount()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(db.couples.map((r) => r.id)).toEqual([COUPLE_B])
    // 남의 커플 데이터는 그대로 — 라우트를 거쳐도 범위가 유지되는지 함께 본다.
    expect(db.activities.map((r) => r.id)).toEqual(['act-b1'])
    expect(db.places.map((r) => r.id)).toEqual(['plc-b1'])
  })

  it('성공하면 세션을 파기한다', async () => {
    await deleteAccount()

    expect(destroyed).toBe(true)
  })

  it('성공하면 app-ready 쿠키를 지운다 (재가입 진입의 전제)', async () => {
    const res = await deleteAccount()

    const cookies = setCookieHeader(res)
    expect(cookies).toContain('app-ready=')
    // 값이 비고 즉시 만료되는 형태여야 실제로 지워진다.
    expect(cookies).toMatch(/app-ready=;/)
  })

  it('성공하면 초대 수락 쪽지(pending-user) 쿠키도 지운다', async () => {
    const res = await deleteAccount()

    expect(setCookieHeader(res)).toContain('today-date-pending-user=')
  })

  it('PAIRED 세션은 409 이고 아무것도 지워지지 않는다', async () => {
    db.users.push({
      id: '55555555-5555-4555-8555-555555555555', couple_id: COUPLE_A,
      email: 'a-partner@example.com', email_verified: true, created_at: '2026-01-05',
    })

    const res = await deleteAccount()
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toBeTruthy()
    expect(db.couples.map((r) => r.id).sort()).toEqual([COUPLE_A, COUPLE_B].sort())
    expect(db.users.filter((r) => r.couple_id === COUPLE_A)).toHaveLength(2)
    expect(db.activities.map((r) => r.id).sort()).toEqual(['act-a1', 'act-b1'])
    // 차단된 요청은 세션을 건드리지 않는다 — 로그아웃될 이유가 없다.
    expect(destroyed).toBe(false)
  })

  it('세션이 없으면 401 이고 아무것도 지워지지 않는다', async () => {
    session = { authenticated: false, destroy: () => { destroyed = true } }

    const res = await deleteAccount()

    expect(res.status).toBe(401)
    expect(db.couples.map((r) => r.id).sort()).toEqual([COUPLE_A, COUPLE_B].sort())
    expect(db.activities.map((r) => r.id).sort()).toEqual(['act-a1', 'act-b1'])
    expect(destroyed).toBe(false)
  })

  it('couple_id 없는 세션은 401 이다 (전환 이전 쿠키)', async () => {
    session = { authenticated: true, user_id: USER_A, destroy: () => { destroyed = true } }

    const res = await deleteAccount()

    expect(res.status).toBe(401)
    expect(db.couples).toHaveLength(2)
  })

  it('세션의 커플이 DB 에 없으면 404 다', async () => {
    session.couple_id = '99999999-9999-4999-8999-999999999999'

    const res = await deleteAccount()

    expect(res.status).toBe(404)
    expect(db.couples).toHaveLength(2)
    expect(destroyed).toBe(false)
  })
})
