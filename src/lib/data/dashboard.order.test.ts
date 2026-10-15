import { describe, it, expect, vi } from 'vitest'

/**
 * 홈 미리보기 제목의 정렬 기준.
 * 다녀온 곳은 `/list` 와 같은 규칙(방문일 → 마지막 수정), 위시리스트는 등록 최신순이어야
 * 홈의 "최근 항목"과 `/list` 의 1번 카드가 일치한다.
 */

type Rec = { table: string; status?: unknown; titles: boolean; orders: Array<[string, unknown]> }
const recs: Rec[] = []

function client() {
  return {
    from(table: string) {
      const rec: Rec = { table, titles: false, orders: [] }
      recs.push(rec)
      const chain: Record<string, unknown> = {}
      chain.select = (cols: string) => {
        rec.titles = cols === 'title'
        return chain
      }
      chain.eq = (col: string, v: unknown) => {
        if (col === 'status') rec.status = v
        return chain
      }
      chain.order = (col: string, opts: unknown) => {
        rec.orders.push([col, opts])
        return chain
      }
      chain.limit = () => chain
      chain.then = (ok: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], count: 0, error: null }).then(ok)
      return chain
    },
  }
}

vi.mock('@/lib/supabase/client', () => ({ getSupabaseClient: () => client() }))

import { getDashboardStats } from './dashboard'

describe('getDashboardStats — 미리보기 제목 정렬', () => {
  it('다녀온 곳은 방문일 → 마지막 수정, 위시리스트는 등록 최신순', async () => {
    recs.length = 0
    await getDashboardStats('11111111-1111-4111-8111-111111111111')

    const titles = recs.filter((r) => r.titles)
    expect(titles).toHaveLength(4)

    for (const r of titles) {
      if (r.status === 'visited') {
        expect(r.orders).toEqual([
          ['visited_at', { ascending: false, nullsFirst: false }],
          ['updated_at', { ascending: false }],
        ])
      } else {
        expect(r.orders).toEqual([['created_at', { ascending: false }]])
      }
    }
  })
})
