import { describe, it, expect } from 'vitest'
import {
  CoupleRow,
  CoupleUserRow,
  deriveWorkspaceState,
  isSetupComplete,
  pickPartnerUser,
  pickSessionUser,
  resolveSessionUser,
} from './couple'

/**
 * DB에 닿지 않는 순수 판별 로직만 다룬다 — 조회 함수(getSoleCouple 등)는 Supabase가 필요해
 * 여기서 다루지 않는다. 이 함수들이 미들웨어의 라우팅·세션 발급 대상·파트너 화면에
 * 노출할 사용자를 결정한다.
 */

const couple = (over: Partial<CoupleRow> = {}): CoupleRow => ({
  id: 'c1',
  passcode_hash: null,
  failed_attempts: 0,
  locked_until: null,
  session_version: 1,
  ...over,
})

const user = (over: Partial<CoupleUserRow> = {}): CoupleUserRow => ({
  id: 'u1',
  couple_id: 'c1',
  email: 'a@example.com',
  email_verified: false,
  created_at: '2026-01-01T00:00:00.000Z',
  ...over,
})

describe('deriveWorkspaceState', () => {
  it('커플이 없으면 NONE', () => {
    expect(deriveWorkspaceState(null, [])).toBe('NONE')
  })

  it('커플 행만 있고 사용자가 없으면 NONE — 설정 시작 전과 같다', () => {
    expect(deriveWorkspaceState(couple(), [])).toBe('NONE')
  })

  it('커플 1개 + 사용자 1명이면 SOLO', () => {
    expect(deriveWorkspaceState(couple(), [user()])).toBe('SOLO')
  })

  it('커플 1개 + 사용자 2명이면 PAIRED', () => {
    expect(
      deriveWorkspaceState(couple(), [user(), user({ id: 'u2', email: 'b@example.com' })])
    ).toBe('PAIRED')
  })
})

describe('isSetupComplete', () => {
  it('패스코드가 없으면 미완료', () => {
    expect(isSetupComplete(couple(), [user({ email_verified: true })])).toBe(false)
  })

  it('인증된 사용자가 없으면 미완료', () => {
    expect(isSetupComplete(couple({ passcode_hash: 'h' }), [user()])).toBe(false)
  })

  it('패스코드 + 인증된 사용자가 모두 있으면 완료', () => {
    expect(
      isSetupComplete(couple({ passcode_hash: 'h' }), [user({ email_verified: true })])
    ).toBe(true)
  })

  it('커플이 없으면 미완료', () => {
    expect(isSetupComplete(null, [user({ email_verified: true })])).toBe(false)
  })
})

describe('pickSessionUser', () => {
  it('인증된 사용자가 없으면 null — 세션을 발급하지 않는다', () => {
    expect(pickSessionUser([user()])).toBeNull()
  })

  it('인증된 사용자만 고른다', () => {
    const verified = user({ id: 'u2', email: 'b@example.com', email_verified: true })
    expect(pickSessionUser([user(), verified])?.id).toBe('u2')
  })

  it('PAIRED 에서는 목록 순서(created_at 오름차순)의 첫 인증 사용자를 고른다', () => {
    const first = user({ id: 'u1', email_verified: true })
    const second = user({ id: 'u2', email: 'b@example.com', email_verified: true })
    expect(pickSessionUser([first, second])?.id).toBe('u1')
  })
})

describe('pickPartnerUser', () => {
  const me = user({ id: 'u1' })
  const partner = user({ id: 'u2', email: 'b@example.com' })

  it('SOLO(나 혼자)면 null — 보여줄 상대가 없다', () => {
    expect(pickPartnerUser([me], 'u1')).toBeNull()
  })

  it('PAIRED 면 세션 사용자가 아닌 나머지 한 명을 고른다', () => {
    expect(pickPartnerUser([me, partner], 'u1')?.id).toBe('u2')
  })

  it('반대쪽 세션에서는 반대쪽 사용자를 고른다 (교차)', () => {
    expect(pickPartnerUser([me, partner], 'u2')?.id).toBe('u1')
  })

  it('세션 사용자가 그 커플의 멤버가 아니면 null — 남의 이메일을 고르지 않는다', () => {
    expect(pickPartnerUser([me, partner], 'u-outsider')).toBeNull()
  })

  it('한 커플에 3명이면 null — 후보가 모호하면 아무도 보여주지 않는다', () => {
    const third = user({ id: 'u3', email: 'c@example.com' })
    expect(pickPartnerUser([me, partner, third], 'u1')).toBeNull()
  })
})

/**
 * 잠금해제의 세션 주체 판정 — 단서 우선순위 표를 전부 덮는다.
 *
 * 이 표가 어긋나면 "초대받은 사람이 파트너의 세션을 받는다"(= 파트너 화면에서 자기
 * 이메일이 상대로 보인다)로 드러난다. 응답 코드로는 보이지 않는 종류의 오류라
 * 여기서 조합별로 못 박는다.
 */
describe('resolveSessionUser', () => {
  const inviter = user({ id: 'u1', email: 'a@example.com', email_verified: true })
  const partner = user({ id: 'u2', email: 'b@example.com', email_verified: true })
  const paired = [inviter, partner]

  it('SOLO 는 단서가 없어도 그 한 명으로 정해진다', () => {
    const r = resolveSessionUser({ users: [inviter] })
    expect(r).toEqual({ kind: 'resolved', user: inviter })
  })

  it('PAIRED 에서 단서가 없으면 묻는다 — 먼저 만들어진 사용자로 수렴하지 않는다', () => {
    expect(resolveSessionUser({ users: paired })).toEqual({ kind: 'needsIdentity' })
  })

  it('pending 쪽지가 있으면 그 사람 — 나중에 합류한 파트너도 자기 세션을 받는다', () => {
    const r = resolveSessionUser({ users: paired, pendingUserId: 'u2' })
    expect(r).toEqual({ kind: 'resolved', user: partner })
  })

  it('쪽지가 가리키는 사용자가 없으면 none — 다른 단서로 되돌리지 않는다', () => {
    const r = resolveSessionUser({ users: paired, pendingUserId: 'gone', deviceUserId: 'u1' })
    expect(r).toEqual({ kind: 'none' })
  })

  it('쪽지가 미인증 사용자를 가리키면 none', () => {
    const unverified = user({ id: 'u3', email: 'c@example.com' })
    const r = resolveSessionUser({ users: [...paired, unverified], pendingUserId: 'u3' })
    expect(r).toEqual({ kind: 'none' })
  })

  it('기기 기억이 있으면 그 사람으로 정해진다', () => {
    const r = resolveSessionUser({ users: paired, deviceUserId: 'u2' })
    expect(r).toEqual({ kind: 'resolved', user: partner })
  })

  it('기기 기억이 낡았으면(사용자 없음) 실패가 아니라 다음 단계로 — PAIRED 면 묻는다', () => {
    expect(resolveSessionUser({ users: paired, deviceUserId: 'gone' })).toEqual({
      kind: 'needsIdentity',
    })
  })

  it('기기 기억이 낡았고 후보가 한 명이면 그 한 명으로 정해진다', () => {
    const r = resolveSessionUser({ users: [inviter], deviceUserId: 'gone' })
    expect(r).toEqual({ kind: 'resolved', user: inviter })
  })

  it('입력한 이메일은 기기 기억을 이긴다 — 한 기기를 둘이 번갈아 쓰는 경우의 탈출구', () => {
    const r = resolveSessionUser({ users: paired, deviceUserId: 'u1', email: 'b@example.com' })
    expect(r).toEqual({ kind: 'resolved', user: partner })
  })

  it('이메일 비교는 대소문자·공백을 무시한다 — 모바일 자동 대문자 입력 구제', () => {
    const r = resolveSessionUser({ users: paired, email: '  B@Example.COM ' })
    expect(r).toEqual({ kind: 'resolved', user: partner })
  })

  it('이 커플의 이메일이 아니면 emailMismatch — 조용히 다른 사람으로 넘어가지 않는다', () => {
    const r = resolveSessionUser({ users: paired, deviceUserId: 'u1', email: 'x@example.com' })
    expect(r).toEqual({ kind: 'emailMismatch' })
  })

  it('쪽지는 이메일보다 앞선다 — 초대 수락 직후는 서버가 아는 사실이 우선', () => {
    const r = resolveSessionUser({ users: paired, pendingUserId: 'u2', email: 'a@example.com' })
    expect(r).toEqual({ kind: 'resolved', user: partner })
  })

  it('인증된 사용자가 없으면 none — 세션을 발급하지 않는다', () => {
    const r = resolveSessionUser({ users: [user({ id: 'u9' })] })
    expect(r).toEqual({ kind: 'none' })
  })
})
