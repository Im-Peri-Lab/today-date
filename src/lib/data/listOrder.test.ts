import { describe, it, expect } from 'vitest'
import { orderByListRule } from './listOrder'

/** order 호출을 순서대로 기록하는 최소 대역. */
function recorder() {
  const calls: Array<[string, { ascending?: boolean; nullsFirst?: boolean } | undefined]> = []
  const q = {
    order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
      calls.push([column, options])
      return q
    },
  }
  return { q, calls }
}

describe('orderByListRule', () => {
  it('다녀온 곳: 방문일 최신순(없으면 뒤로) → 마지막 수정 최신순', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'visited')
    expect(calls).toEqual([
      ['visited_at', { ascending: false, nullsFirst: false }],
      ['updated_at', { ascending: false }],
    ])
  })

  it('위시리스트: 등록 최신순', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'wishlist')
    expect(calls).toEqual([['created_at', { ascending: false }]])
  })

  it('방문예정만(위시리스트): 예정일 임박순 → 종일 먼저 → 시간 오름차순 → 등록 최신순', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'wishlist', true)
    expect(calls).toEqual([
      ['planned_at', { ascending: true }],
      ['planned_time', { ascending: true, nullsFirst: true }],
      ['created_at', { ascending: false }],
    ])
  })

  it('같은 날짜면 종일 → 09:00 → 19:00 순으로 놓인다(PostgREST NULLS 규칙대로 적용)', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'wishlist', true)
    type Row = Record<string, string | null>
    const rows: Row[] = [
      { id: 'night', planned_at: '2026-12-19', planned_time: '19:00:00', created_at: '3' },
      { id: 'next-day', planned_at: '2026-12-20', planned_time: null, created_at: '9' },
      { id: 'morning', planned_at: '2026-12-19', planned_time: '09:00:00', created_at: '1' },
      { id: 'all-day', planned_at: '2026-12-19', planned_time: null, created_at: '2' },
    ]
    const sorted = [...rows].sort((a, b) => {
      for (const [col, opt] of calls) {
        const av = a[col]
        const bv = b[col]
        if (av === bv) continue
        if (av === null) return opt?.nullsFirst ? -1 : 1
        if (bv === null) return opt?.nullsFirst ? 1 : -1
        return (av < bv ? -1 : 1) * (opt?.ascending ? 1 : -1)
      }
      return 0
    })
    expect(sorted.map((r) => r.id)).toEqual(['all-day', 'morning', 'night', 'next-day'])
  })

  it('방문예정만 플래그는 다녀온 곳 정렬을 바꾸지 않는다', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'visited', true)
    expect(calls[0][0]).toBe('visited_at')
  })
})
