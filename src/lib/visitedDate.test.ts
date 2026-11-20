import { describe, expect, it } from 'vitest'
import { defaultVisitedDate, localTodayIso } from './visitedDate'

describe('defaultVisitedDate', () => {
  const today = '2026-11-20'

  it('방문예정일이 없으면 오늘', () => {
    expect(defaultVisitedDate(null, today)).toBe(today)
    expect(defaultVisitedDate(undefined, today)).toBe(today)
    expect(defaultVisitedDate('', today)).toBe(today)
  })

  it('방문예정일이 오늘이면 방문예정일(=오늘)', () => {
    expect(defaultVisitedDate('2026-11-20', today)).toBe('2026-11-20')
  })

  it('방문예정일이 지났으면 방문예정일', () => {
    expect(defaultVisitedDate('2026-11-19', today)).toBe('2026-11-19')
    expect(defaultVisitedDate('2025-12-31', today)).toBe('2025-12-31')
  })

  it('방문예정일이 미래면 오늘', () => {
    expect(defaultVisitedDate('2026-11-21', today)).toBe(today)
    expect(defaultVisitedDate('2027-01-01', today)).toBe(today)
  })

  it('타임스탬프 형태로 와도 날짜 부분만 비교', () => {
    expect(defaultVisitedDate('2026-11-18T00:00:00', today)).toBe('2026-11-18')
  })

  it('형식이 깨진 값이면 오늘', () => {
    expect(defaultVisitedDate('not-a-date', today)).toBe(today)
  })
})

describe('localTodayIso', () => {
  it('기기 로컬 날짜를 쓴다 — KST 새벽에도 UTC 전날로 밀리지 않는다', () => {
    // 로컬 2026-11-20 00:30 (UTC 로는 KST 기준 전날 15:30)
    const earlyMorning = new Date(2026, 10, 20, 0, 30)
    expect(localTodayIso(earlyMorning)).toBe('2026-11-20')
    const lateNight = new Date(2026, 10, 20, 23, 59)
    expect(localTodayIso(lateNight)).toBe('2026-11-20')
  })
})
