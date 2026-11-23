import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * 대시보드 집계의 DB 오류 처리.
 *
 * supabase-js 는 네트워크 실패조차 throw 하지 않고 `{ data: null, error }` 로
 * 돌려준다. 이 계층이 error 를 검사하지 않으면 DB 가 죽은 상태가 "전부 0" 인
 * 정상 응답(200)으로 나가고, 사용자에게는 "위시리스트가 비었다"로 보인다.
 * 빈 워크스페이스와 장애를 구별할 수 없는 응답을 막는 것이 이 테스트의 목적이다.
 */

/**
 * 8개 쿼리 대역. 쿼리가 어느 테이블·상태·종류(개수/제목)인지 기록해 `resolve` 가 쿼리별로 다른 결과를 낼 수 있다.
 * 체이닝 메서드는 자기 자신을 돌려주고, await 지점에서 thenable 로 결과를 돌려준다.
 */
type Kind = 'count' | 'titles'
type Resolve = (q: { table: string; status: string; kind: Kind }) => Record<string, unknown>

function stubClient(resolve: Resolve) {
  return {
    from: (table: string) => {
      const q = { table, status: '', kind: 'titles' as Kind }
      const chain: Record<string, unknown> = {}
      chain.select = (_cols: string, opts?: { head?: boolean }) => {
        q.kind = opts?.head ? 'count' : 'titles'
        return chain
      }
      chain.eq = (col: string, value: string) => {
        if (col === 'status') q.status = value
        return chain
      }
      chain.order = () => chain
      chain.limit = () => chain
      chain.then = (onfulfilled: (v: unknown) => unknown) => Promise.resolve(resolve(q)).then(onfulfilled)
      return chain
    },
  }
}

let resolve: Resolve
const setAll = (outcome: Record<string, unknown>) => {
  resolve = () => outcome
}

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => stubClient(q => resolve(q)),
}))

const reportError = vi.fn()
vi.mock('@/lib/observability', () => ({
  reportError: (...args: unknown[]) => reportError(...args),
}))

import { getDashboardStats } from './dashboard'

const COUPLE = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  setAll({ data: [], count: 0, error: null })
  reportError.mockReset()
})

describe('getDashboardStats — DB 오류 처리', () => {
  it('쿼리가 error 를 돌려주면 던진다 (0으로 조용히 넘어가지 않는다)', async () => {
    setAll({ data: null, count: null, error: { message: 'fetch failed' } })

    await expect(getDashboardStats(COUPLE)).rejects.toThrow('대시보드 집계 실패')
  })

  it('오류 메시지에 실패한 집계 이름과 원인이 담긴다', async () => {
    setAll({ data: null, count: null, error: { message: 'getaddrinfo ENOTFOUND' } })

    await expect(getDashboardStats(COUPLE)).rejects.toThrow(
      /대시보드 집계 실패\(위시리스트 액티비티 수\): getaddrinfo ENOTFOUND/
    )
  })

  it('정상 응답은 그대로 집계한다', async () => {
    setAll({
      data: [{ title: '한강 산책', planned_at: '2026-12-12', visited_at: '2026-11-21' }, { title: '전시회' }],
      count: 2,
      error: null,
    })

    const stats = await getDashboardStats(COUPLE)

    expect(stats.wishlistActivities).toBe(2)
    expect(stats.visitedPlaces).toBe(2)
    expect(stats.wishlistActivityTitles).toEqual(['한강 산책', '전시회'])
    expect(stats.wishlistActivityPreviews).toEqual([
      { title: '한강 산책', date: '2026-12-12' },
      { title: '전시회', date: null },
    ])
    expect(stats.visitedPlacePreviews?.[0]).toEqual({ title: '한강 산책', date: '2026-11-21' })
  })

  it('빈 워크스페이스는 오류가 아니라 0으로 집계된다', async () => {
    setAll({ data: [], count: 0, error: null })

    const stats = await getDashboardStats(COUPLE)

    expect(stats.wishlistActivities).toBe(0)
    expect(stats.wishlistActivityTitles).toEqual([])
  })
})

describe('getDashboardStats — 부분 실패', () => {
  const FAIL = { data: null, count: null, error: { message: 'timeout' } }
  const OK_COUNT = { data: null, count: 3, error: null }
  const OK_TITLES = { data: [{ title: '한강 산책', planned_at: '2026-12-12', visited_at: '2026-11-21' }], count: null, error: null }

  it('미리보기 쿼리가 모두 실패해도 개수는 정상으로 돌려주고 미리보기만 비운다', async () => {
    resolve = q => (q.kind === 'count' ? OK_COUNT : FAIL)

    const stats = await getDashboardStats(COUPLE)

    expect(stats.wishlistActivities).toBe(3)
    expect(stats.wishlistPlaces).toBe(3)
    expect(stats.visitedActivities).toBe(3)
    expect(stats.visitedPlaces).toBe(3)
    expect(stats.wishlistActivityTitles).toEqual([])
    expect(stats.visitedPlacePreviews).toEqual([])
    expect(reportError).toHaveBeenCalledTimes(4)
  })

  it('한 타일의 미리보기만 실패하면 그 타일만 비고 나머지는 유지된다', async () => {
    resolve = q => {
      if (q.kind === 'count') return OK_COUNT
      return q.table === 'places' && q.status === 'visited' ? FAIL : OK_TITLES
    }

    const stats = await getDashboardStats(COUPLE)

    expect(stats.visitedPlaceTitles).toEqual([])
    expect(stats.visitedPlaces).toBe(3)
    expect(stats.wishlistPlaceTitles).toEqual(['한강 산책'])
    expect(stats.visitedActivityPreviews).toEqual([{ title: '한강 산책', date: '2026-11-21' }])
    expect(reportError).toHaveBeenCalledTimes(1)
    const [tag, err] = reportError.mock.calls[0]
    expect(tag).toContain('다녀온 다이닝 제목')
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toContain('timeout')
  })

  it('개수 쿼리가 하나라도 실패하면 미리보기가 정상이어도 전체를 던진다', async () => {
    resolve = q => (q.kind === 'count' && q.table === 'places' && q.status === 'visited' ? FAIL : q.kind === 'count' ? OK_COUNT : OK_TITLES)

    await expect(getDashboardStats(COUPLE)).rejects.toThrow(/대시보드 집계 실패\(다녀온 다이닝 수\)/)
    expect(reportError).not.toHaveBeenCalled()
  })
})
