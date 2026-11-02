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

  it('방문예정만(위시리스트): 예정일 임박순 → 등록 최신순', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'wishlist', true)
    expect(calls).toEqual([
      ['planned_at', { ascending: true }],
      ['created_at', { ascending: false }],
    ])
  })

  it('방문예정만 플래그는 다녀온 곳 정렬을 바꾸지 않는다', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'visited', true)
    expect(calls[0][0]).toBe('visited_at')
  })
})
