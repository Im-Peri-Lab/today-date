import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * 대시보드 집계의 DB 오류 처리.
 *
 * supabase-js 는 네트워크 실패조차 throw 하지 않고 `{ data: null, error }` 로
 * 돌려준다. 이 계층이 error 를 검사하지 않으면 DB 가 죽은 상태가 "전부 0" 인
 * 정상 응답(200)으로 나가고, 사용자에게는 "위시리스트가 비었다"로 보인다.
 * 빈 워크스페이스와 장애를 구별할 수 없는 응답을 막는 것이 이 테스트의 목적이다.
 */

/** 8개 쿼리가 모두 같은 결과를 내는 최소 대역 — 체이닝 메서드는 자기 자신을 돌려준다. */
function stubClient(outcome: Record<string, unknown>) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'order', 'limit']) {
    chain[method] = () => chain
  }
  // await 지점: 쿼리 빌더가 thenable 로 결과를 돌려준다.
  chain.then = (onfulfilled: (v: unknown) => unknown) => Promise.resolve(outcome).then(onfulfilled)
  return { from: () => chain }
}

let outcome: Record<string, unknown>

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => stubClient(outcome),
}))

import { getDashboardStats } from './dashboard'

const COUPLE = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  outcome = { data: [], count: 0, error: null }
})

describe('getDashboardStats — DB 오류 처리', () => {
  it('쿼리가 error 를 돌려주면 던진다 (0으로 조용히 넘어가지 않는다)', async () => {
    outcome = { data: null, count: null, error: { message: 'fetch failed' } }

    await expect(getDashboardStats(COUPLE)).rejects.toThrow('대시보드 집계 실패')
  })

  it('오류 메시지에 실패한 집계 이름과 원인이 담긴다', async () => {
    outcome = { data: null, count: null, error: { message: 'getaddrinfo ENOTFOUND' } }

    await expect(getDashboardStats(COUPLE)).rejects.toThrow(
      /대시보드 집계 실패\(위시리스트 액티비티 수\): getaddrinfo ENOTFOUND/
    )
  })

  it('정상 응답은 그대로 집계한다', async () => {
    outcome = { data: [{ title: '한강 산책' }, { title: '전시회' }], count: 2, error: null }

    const stats = await getDashboardStats(COUPLE)

    expect(stats.wishlistActivities).toBe(2)
    expect(stats.visitedPlaces).toBe(2)
    expect(stats.wishlistActivityTitles).toEqual(['한강 산책', '전시회'])
  })

  it('빈 워크스페이스는 오류가 아니라 0으로 집계된다', async () => {
    outcome = { data: [], count: 0, error: null }

    const stats = await getDashboardStats(COUPLE)

    expect(stats.wishlistActivities).toBe(0)
    expect(stats.wishlistActivityTitles).toEqual([])
  })
})
