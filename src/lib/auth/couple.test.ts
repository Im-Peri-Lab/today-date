import { describe, it, expect } from 'vitest'
import {
  CoupleRow,
  CoupleUserRow,
  deriveWorkspaceState,
  isSetupComplete,
  pickSessionUser,
} from './couple'

/**
 * DB에 닿지 않는 순수 판별 로직만 다룬다 — 조회 함수(getSoleCouple 등)는 Supabase가 필요해
 * 여기서 다루지 않는다. 이 세 함수가 미들웨어의 라우팅과 세션 발급 대상을 결정한다.
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
