import { describe, it, expect } from 'vitest'
import { nextDayIso } from './date'

describe('nextDayIso', () => {
  it('같은 달 안에서 하루 올린다', () => {
    expect(nextDayIso('2026-11-03')).toBe('2026-11-04')
  })

  it('월말은 다음 달 1일로 넘어간다(30일·31일 달)', () => {
    expect(nextDayIso('2026-04-30')).toBe('2026-05-01')
    expect(nextDayIso('2026-01-31')).toBe('2026-02-01')
  })

  it('연말은 다음 해 1월 1일로 넘어간다', () => {
    expect(nextDayIso('2026-12-31')).toBe('2027-01-01')
  })

  it('윤년 2월을 처리한다', () => {
    expect(nextDayIso('2028-02-28')).toBe('2028-02-29')
    expect(nextDayIso('2028-02-29')).toBe('2028-03-01')
    expect(nextDayIso('2026-02-28')).toBe('2026-03-01')
    expect(nextDayIso('2100-02-28')).toBe('2100-03-01')
  })

  it('해석할 수 없는 값은 그대로 돌려준다', () => {
    expect(nextDayIso('')).toBe('')
    expect(nextDayIso('abc')).toBe('abc')
  })
})
