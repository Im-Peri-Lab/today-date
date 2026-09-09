import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeSupabase, type FakeDb, type FakeRow } from './fakeSupabase'

/**
 * SOLO 계정 삭제 — 삭제 범위와 삭제 순서 검증.
 *
 * 이 기능의 위험은 "안 지워지는 것"이 아니라 **"너무 많이 지워지는 것"** 이다. 조건이
 * 하나라도 빠진 DELETE 는 전 커플의 행을 지우고, 그건 되돌릴 수 없다. 그래서 모든
 * 테스트가 두 가지를 함께 본다: 대상 커플의 행이 사라졌는가, 그리고 **남의 커플의 행이
 * 한 건도 줄지 않았는가.**
 *
 * 순서도 함께 본다. activities/places/recommendations_log 는 couples 를
 * `on delete restrict` 로 참조하므로(012) couples 를 먼저 지우면 실제 DB 는 23503 으로
 * 거부한다. 로컬 Postgres 가 없어 제약 자체를 실행해 볼 수는 없으니, 대역에 나가는
 * DELETE 의 순서를 직접 기록해 "restrict 참조가 couples 보다 먼저 정리되는가"를 단정한다.
 * (제약이 실제로 거부하는 것까지는 e2e 스텁이 23503 을 흉내내 확인한다 —
 *  § e2e/stub/server.mjs RESTRICT_REFS, e2e/db/isolation.spec.ts)
 */

const COUPLE_A = '11111111-1111-4111-8111-111111111111'
const COUPLE_B = '22222222-2222-4222-8222-222222222222'
const USER_A = '33333333-3333-4333-8333-333333333333'
const USER_A2 = '33333333-3333-4333-8333-333333333334'
const USER_B = '44444444-4444-4444-8444-444444444444'
const EMAIL_A = 'a@example.com'
const EMAIL_A2 = 'a-partner@example.com'
const EMAIL_B = 'b@example.com'

let db: FakeDb
/** deleteSoloAccount 가 내보낸 DELETE 의 테이블 순서. */
let deleteOrder: string[]

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => {
    const client = createFakeSupabase(db)
    return {
      from(table: string) {
        const query = client.from(table)
        const originalDelete = query.delete.bind(query)
        // delete() 가 호출된 순간의 테이블만 기록한다 — select 는 순서 판정과 무관하다.
        query.delete = (...args: unknown[]) => {
          deleteOrder.push(table)
          return originalDelete(...args)
        }
        return query
      },
    }
  },
}))

import { deleteSoloAccount } from '@/lib/auth/accountDeletion'

/**
 * 커플 A(SOLO, 삭제 대상) + 커플 B(무관한 제3자).
 *
 * 커플 B 에는 A 와 같은 종류의 행을 모두 심는다 — 도메인 3종, 사용자, 그리고
 * email_tokens 두 갈래(자기 이메일로 온 인증 토큰 + 자기가 보낸 파트너 초대).
 * 삭제가 테이블 단위로 번지면 이 중 하나라도 사라지므로 즉시 드러난다.
 */
function seed(): FakeDb {
  return {
    couples: [
      { id: COUPLE_A, passcode_hash: 'hash-a', session_version: 1, created_at: '2026-01-01' },
      { id: COUPLE_B, passcode_hash: 'hash-b', session_version: 1, created_at: '2026-01-02' },
    ],
    users: [
      {
        id: USER_A, couple_id: COUPLE_A, email: EMAIL_A,
        email_verified: true, created_at: '2026-01-01',
      },
      {
        id: USER_B, couple_id: COUPLE_B, email: EMAIL_B,
        email_verified: true, created_at: '2026-01-02',
      },
    ],
    activities: [
      { id: 'act-a1', couple_id: COUPLE_A, title: 'A 액티비티 1', status: 'wishlist' },
      { id: 'act-a2', couple_id: COUPLE_A, title: 'A 액티비티 2', status: 'visited' },
      { id: 'act-b1', couple_id: COUPLE_B, title: 'B 액티비티', status: 'wishlist' },
    ],
    places: [
      { id: 'plc-a1', couple_id: COUPLE_A, title: 'A 다이닝', status: 'wishlist' },
      { id: 'plc-b1', couple_id: COUPLE_B, title: 'B 다이닝', status: 'wishlist' },
    ],
    recommendations_log: [
      { id: 'log-a1', couple_id: COUPLE_A, track: 'activity', recommend_type: 'quick' },
      { id: 'log-b1', couple_id: COUPLE_B, track: 'place', recommend_type: 'quick' },
    ],
    email_tokens: [
      // A 의 인증 토큰 — couple_id 는 NULL 이고 target_email 로만 A 에 묶인다.
      {
        id: 'tok-a-verify', token_hash: 'h1', purpose: 'verify_email',
        target_email: EMAIL_A, couple_id: null, used_at: null, expires_at: '2099-01-01',
      },
      {
        id: 'tok-a-reset', token_hash: 'h2', purpose: 'reset_passcode',
        target_email: EMAIL_A, couple_id: null, used_at: null, expires_at: '2099-01-01',
      },
      // A 가 보낸 파트너 초대 — couple_id 로 A 에 묶인다.
      {
        id: 'tok-a-invite', token_hash: 'h3', purpose: 'invite_partner',
        target_email: 'someone@example.com', couple_id: COUPLE_A,
        used_at: null, expires_at: '2099-01-01',
      },
      // B 의 인증 토큰 — 남아야 한다.
      {
        id: 'tok-b-verify', token_hash: 'h4', purpose: 'verify_email',
        target_email: EMAIL_B, couple_id: null, used_at: null, expires_at: '2099-01-01',
      },
      // B 가 보낸 파트너 초대 — 남아야 한다.
      {
        id: 'tok-b-invite', token_hash: 'h5', purpose: 'invite_partner',
        target_email: 'other@example.com', couple_id: COUPLE_B,
        used_at: null, expires_at: '2099-01-01',
      },
    ],
  }
}

const ids = (table: string) => (db[table] ?? []).map((r: FakeRow) => r.id).sort()

/** 커플 B 의 행이 전부 그대로인지 — 모든 테스트가 이걸 함께 본다. */
function expectCoupleBIntact() {
  expect(db.couples.filter((r) => r.id === COUPLE_B)).toHaveLength(1)
  expect(db.users.filter((r) => r.couple_id === COUPLE_B)).toHaveLength(1)
  expect(db.activities.filter((r) => r.couple_id === COUPLE_B)).toHaveLength(1)
  expect(db.places.filter((r) => r.couple_id === COUPLE_B)).toHaveLength(1)
  expect(db.recommendations_log.filter((r) => r.couple_id === COUPLE_B)).toHaveLength(1)
  expect(ids('email_tokens')).toContain('tok-b-verify')
  expect(ids('email_tokens')).toContain('tok-b-invite')
}

beforeEach(() => {
  db = seed()
  deleteOrder = []
})

describe('SOLO 계정 삭제 · 성공', () => {
  it('대상 커플의 행이 모든 테이블에서 사라진다', async () => {
    const result = await deleteSoloAccount(COUPLE_A)

    expect(result.ok).toBe(true)

    expect(db.couples.filter((r) => r.id === COUPLE_A)).toHaveLength(0)
    expect(db.users.filter((r) => r.couple_id === COUPLE_A)).toHaveLength(0)
    expect(db.activities.filter((r) => r.couple_id === COUPLE_A)).toHaveLength(0)
    expect(db.places.filter((r) => r.couple_id === COUPLE_A)).toHaveLength(0)
    expect(db.recommendations_log.filter((r) => r.couple_id === COUPLE_A)).toHaveLength(0)
  })

  it('커플 B 의 행은 한 건도 줄지 않는다', async () => {
    await deleteSoloAccount(COUPLE_A)
    expectCoupleBIntact()
  })

  it('삭제된 이메일이 users 에서 사라져 재가입이 가능해진다', async () => {
    await deleteSoloAccount(COUPLE_A)

    // users.email 전역 unique 가 재가입을 막던 유일한 이유였다(§ lib/auth/invite.ts).
    expect(db.users.some((r) => r.email === EMAIL_A)).toBe(false)
  })

  it('삭제 행 수를 테이블별로 보고한다', async () => {
    const result = await deleteSoloAccount(COUPLE_A)

    expect(result.ok && result.deleted).toMatchObject({
      activities: 2,
      places: 1,
      recommendations_log: 1,
      'email_tokens.couple': 1,
      'email_tokens.email': 2,
      users: 1,
      couples: 1,
    })
  })
})

describe('SOLO 계정 삭제 · 삭제 순서(외래키)', () => {
  it('restrict 로 참조하는 도메인 3종이 couples 보다 먼저 지워진다', async () => {
    await deleteSoloAccount(COUPLE_A)

    const couplesAt = deleteOrder.indexOf('couples')
    expect(couplesAt).toBeGreaterThanOrEqual(0)

    for (const table of ['activities', 'places', 'recommendations_log']) {
      const at = deleteOrder.indexOf(table)
      expect(at, `${table} 이 DELETE 되지 않았다`).toBeGreaterThanOrEqual(0)
      expect(at, `${table} 이 couples 보다 나중에 지워진다 — 실제 DB 는 23503 으로 거부한다`)
        .toBeLessThan(couplesAt)
    }
  })

  it('couples 가 마지막이다 — 부분 실패 시 되돌아올 길을 남기는 순서', async () => {
    await deleteSoloAccount(COUPLE_A)

    expect(deleteOrder[deleteOrder.length - 1]).toBe('couples')
  })

  it('users 는 couples 보다 먼저, 도메인 데이터보다 나중에 지워진다', async () => {
    await deleteSoloAccount(COUPLE_A)

    // 사용자 이메일이 email_tokens 삭제의 단서이므로 그 뒤에 와야 한다.
    expect(deleteOrder.indexOf('users')).toBeGreaterThan(deleteOrder.indexOf('email_tokens'))
    expect(deleteOrder.indexOf('users')).toBeLessThan(deleteOrder.indexOf('couples'))
  })
})

describe('SOLO 계정 삭제 · email_tokens 범위', () => {
  it('내 이메일의 인증·재설정 토큰과 내가 보낸 초대가 사라진다', async () => {
    await deleteSoloAccount(COUPLE_A)

    const remaining = ids('email_tokens')
    expect(remaining).not.toContain('tok-a-verify')
    expect(remaining).not.toContain('tok-a-reset')
    expect(remaining).not.toContain('tok-a-invite')
  })

  it('다른 커플이 내 이메일로 보낸 대기 초대는 지우지 않는다 (남의 커플 행)', async () => {
    /*
     * invite_partner 행의 target_email 은 "초대받는 사람"이고 소유자는 couple_id 쪽이다.
     * 목적을 가리지 않고 target_email 로 지우면 커플 B 의 초대장을 우리가 대신 폐기하게 된다.
     * (이 상태는 발송 가드상 드물지만, 삭제 범위는 드문 상태에서도 정확해야 한다.)
     */
    db.email_tokens.push({
      id: 'tok-b-invite-to-a', token_hash: 'h6', purpose: 'invite_partner',
      target_email: EMAIL_A, couple_id: COUPLE_B, used_at: null, expires_at: '2099-01-01',
    })

    await deleteSoloAccount(COUPLE_A)

    expect(ids('email_tokens')).toContain('tok-b-invite-to-a')
    expectCoupleBIntact()
  })

  it('다른 커플 이메일의 인증 토큰은 남는다', async () => {
    await deleteSoloAccount(COUPLE_A)

    const remaining = db.email_tokens.map((r) => r.target_email)
    expect(remaining).toContain(EMAIL_B)
  })
})

describe('SOLO 계정 삭제 · 차단', () => {
  it('PAIRED 는 차단되고 아무것도 지워지지 않는다', async () => {
    db.users.push({
      id: USER_A2, couple_id: COUPLE_A, email: EMAIL_A2,
      email_verified: true, created_at: '2026-01-05',
    })

    const before = {
      couples: ids('couples'),
      users: ids('users'),
      activities: ids('activities'),
      places: ids('places'),
      recommendations_log: ids('recommendations_log'),
      email_tokens: ids('email_tokens'),
    }

    const result = await deleteSoloAccount(COUPLE_A)

    expect(result).toEqual({ ok: false, reason: 'paired' })
    // 응답 코드만 보면 부족하다 — 차단은 "한 건도 지우지 않았다"까지가 차단이다.
    expect(deleteOrder).toEqual([])
    for (const [table, expected] of Object.entries(before)) {
      expect(ids(table), `${table} 이 변했다`).toEqual(expected)
    }
  })

  it('없는 커플 id 는 not_found 이고 다른 커플을 건드리지 않는다', async () => {
    const result = await deleteSoloAccount('99999999-9999-4999-8999-999999999999')

    expect(result).toEqual({ ok: false, reason: 'not_found' })
    expect(deleteOrder).toEqual([])
    expectCoupleBIntact()
    expect(db.couples.filter((r) => r.id === COUPLE_A)).toHaveLength(1)
  })

  it('빈 coupleId 는 DELETE 를 한 문장도 내보내지 않는다', async () => {
    /*
     * 이 방어가 없으면 `.eq('couple_id', '')` 가 되어 조건이 아무 행에도 맞지 않는 것처럼
     * 보이지만, 값이 undefined 로 흘러 들어가는 경우엔 필터가 사라진 전체 삭제가 된다
     * (§ lib/auth/coupleScope.ts). 조건을 만들기 전에 값 자체를 거부한다.
     */
    const result = await deleteSoloAccount('')

    expect(result).toEqual({ ok: false, reason: 'not_found' })
    expect(deleteOrder).toEqual([])
    expect(ids('couples')).toEqual([COUPLE_A, COUPLE_B].sort())
  })
})

describe('SOLO 계정 삭제 · 재시도(부분 삭제 복구)', () => {
  it('사용자 행이 이미 없는 커플도 지울 수 있다 (5번에서 실패한 이전 시도의 흔적)', async () => {
    /*
     * 트랜잭션이 없어 couples 삭제만 실패하면 "사용자 0명 + 커플 행" 이 남는다.
     * 이 상태를 거부하면 재시도가 영구히 막히고 고아 커플이 남는다 — 지울 수 있어야 한다.
     */
    db.users = db.users.filter((r) => r.couple_id !== COUPLE_A)

    const result = await deleteSoloAccount(COUPLE_A)

    expect(result.ok).toBe(true)
    expect(db.couples.filter((r) => r.id === COUPLE_A)).toHaveLength(0)
    expectCoupleBIntact()
  })

  it('두 번 연달아 호출해도 남의 데이터가 줄지 않는다 (멱등)', async () => {
    expect((await deleteSoloAccount(COUPLE_A)).ok).toBe(true)

    // 두 번째 호출은 지울 커플이 없으므로 실패로 끝난다 — 중요한 건 부작용이 없다는 것이다.
    const second = await deleteSoloAccount(COUPLE_A)
    expect(second.ok).toBe(false)

    expectCoupleBIntact()
  })
})
