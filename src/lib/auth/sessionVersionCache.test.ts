import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CoupleRow } from '@/lib/auth/couple'
import {
  SESSION_VERSION_TTL_MS,
  clearSessionVersionCache,
  isSessionVersionCurrent,
} from './sessionVersionCache'

function couple(version: number): CoupleRow {
  return {
    id: 'c1',
    passcode_hash: 'h',
    failed_attempts: 0,
    locked_until: null,
    session_version: version,
  }
}

describe('isSessionVersionCurrent', () => {
  let t = 0
  const now = () => t

  beforeEach(() => {
    t = 1_000_000
    clearSessionVersionCache()
  })

  it('캐시 미스는 DB 조회 후 비교한다', async () => {
    const load = vi.fn().mockResolvedValue(couple(1))
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('TTL 안의 일치 판정은 DB 를 타지 않는다', async () => {
    const load = vi.fn().mockResolvedValue(couple(1))
    await isSessionVersionCurrent('c1', 1, { load, now })
    t += SESSION_VERSION_TTL_MS - 1
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('TTL 이 지나면 다시 DB 를 조회한다', async () => {
    const load = vi.fn().mockResolvedValue(couple(1))
    await isSessionVersionCurrent('c1', 1, { load, now })
    t += SESSION_VERSION_TTL_MS
    await isSessionVersionCurrent('c1', 1, { load, now })
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('재설정 후 옛 쿠키는 TTL 안에서는 통과하고 TTL 뒤에는 무효가 된다(의도된 트레이드오프)', async () => {
    const load = vi.fn().mockResolvedValueOnce(couple(1)).mockResolvedValue(couple(2))
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(true)
    t += 5_000 // 이 사이 다른 인스턴스에서 재설정(+1)
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(true)
    t += SESSION_VERSION_TTL_MS
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(false)
  })

  it('캐시가 옛 버전이어도 새로 발급된 쿠키(새 버전)는 DB 재확인으로 통과한다', async () => {
    const load = vi.fn().mockResolvedValueOnce(couple(1)).mockResolvedValue(couple(2))
    await isSessionVersionCurrent('c1', 1, { load, now }) // 캐시에 v1
    t += 3_000 // 재설정 후 새 패스코드로 로그인 → 쿠키는 v2
    expect(await isSessionVersionCurrent('c1', 2, { load, now })).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('커플 부재(null)도 TTL 동안 캐시되고 무효로 판정한다', async () => {
    const load = vi.fn().mockResolvedValue(null)
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(false)
    t += 1_000
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(false)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('조회 실패는 던지고 캐시하지 않는다(호출부 fail-open)', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValue(couple(1))
    await expect(isSessionVersionCurrent('c1', 1, { load, now })).rejects.toThrow('db down')
    expect(await isSessionVersionCurrent('c1', 1, { load, now })).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('couple_id 별로 따로 캐시한다', async () => {
    const load = vi.fn().mockImplementation(async (id: string) => ({ ...couple(id === 'a' ? 1 : 2), id }))
    expect(await isSessionVersionCurrent('a', 1, { load, now })).toBe(true)
    expect(await isSessionVersionCurrent('b', 1, { load, now })).toBe(false)
    expect(load).toHaveBeenCalledTimes(2)
  })
})
