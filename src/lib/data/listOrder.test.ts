import { describe, it, expect } from 'vitest'
import { orderByListRule, sortWishlistRows } from './listOrder'
import { todayKstIso } from '@/lib/date'

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

  it('위시리스트: DB 단계는 등록 최신순(3그룹 정렬은 sortWishlistRows 가 이어서 한다)', () => {
    const { q, calls } = recorder()
    orderByListRule(q, 'wishlist')
    expect(calls).toEqual([['created_at', { ascending: false }]])
  })
})

describe('sortWishlistRows', () => {
  const TODAY = '2026-11-20'
  type Row = { id: string; planned_at: string | null; planned_time: string | null; created_at: string }
  const row = (id: string, planned_at: string | null, planned_time: string | null, created_at: string): Row => ({
    id,
    planned_at,
    planned_time,
    created_at,
  })
  const ids = (rows: Row[]) => sortWishlistRows(rows, TODAY).map((r) => r.id)

  it('예정일이 내일인 오래된 항목이 최근 등록 항목보다 위에 온다', () => {
    expect(
      ids([
        row('new-unplanned', null, null, '2026-11-19T00:00:00Z'),
        row('old-tomorrow', '2026-11-21', null, '2025-01-01T00:00:00Z'),
      ])
    ).toEqual(['old-tomorrow', 'new-unplanned'])
  })

  it('3그룹: 오늘 이후 예정 → 지난 예정 → 예정 없음', () => {
    expect(
      ids([
        row('none', null, null, '2026-11-19T00:00:00Z'),
        row('past', '2026-11-19', null, '2026-01-01T00:00:00Z'),
        row('today', '2026-11-20', null, '2026-01-01T00:00:00Z'),
        row('future', '2026-12-01', null, '2026-01-01T00:00:00Z'),
      ])
    ).toEqual(['today', 'future', 'past', 'none'])
  })

  it('① 다가오는 예정: 날짜 가까운 순 → 종일 먼저 → 시작 시간 빠른 순 → 등록 최신순', () => {
    expect(
      ids([
        row('next-day', '2026-12-20', null, '9'),
        row('night', '2026-12-19', '19:00:00', '3'),
        row('morning', '2026-12-19', '09:00:00', '1'),
        row('all-day-old', '2026-12-19', null, '2'),
        row('all-day-new', '2026-12-19', null, '4'),
      ])
    ).toEqual(['all-day-new', 'all-day-old', 'morning', 'night', 'next-day'])
  })

  it('② 지난 예정: 예정일 최근 순', () => {
    expect(
      ids([
        row('long-ago', '2026-01-05', null, '1'),
        row('yesterday', '2026-11-19', null, '1'),
        row('last-month', '2026-10-10', null, '1'),
      ])
    ).toEqual(['yesterday', 'last-month', 'long-ago'])
  })

  it('③ 예정 없음: 등록 최신순', () => {
    expect(
      ids([
        row('a', null, null, '2026-01-01T00:00:00Z'),
        row('c', null, null, '2026-03-01T00:00:00Z'),
        row('b', null, null, '2026-02-01T00:00:00Z'),
      ])
    ).toEqual(['c', 'b', 'a'])
  })

  it('원본 배열은 바꾸지 않는다', () => {
    const rows = [row('b', null, null, '1'), row('a', '2026-11-21', null, '0')]
    sortWishlistRows(rows, TODAY)
    expect(rows.map((r) => r.id)).toEqual(['b', 'a'])
  })
})

describe('todayKstIso', () => {
  it('UTC 15:00 이후는 KST 로 다음 날이다', () => {
    expect(todayKstIso(new Date('2026-11-19T14:59:59Z'))).toBe('2026-11-19')
    expect(todayKstIso(new Date('2026-11-19T15:00:00Z'))).toBe('2026-11-20')
  })

  it('연말 경계도 KST 로 넘어간다', () => {
    expect(todayKstIso(new Date('2026-12-31T15:30:00Z'))).toBe('2027-01-01')
  })
})
