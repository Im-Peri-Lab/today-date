import { describe, it, expect } from 'vitest'
import { defaultPlannedTime } from './plannedTime'

describe('defaultPlannedTime', () => {
  it('다이닝: 점심만 12:00, 저녁 포함 18:30', () => {
    expect(defaultPlannedTime('place', ['lunch'])).toBe('12:00')
    expect(defaultPlannedTime('place', ['dinner'])).toBe('18:30')
    expect(defaultPlannedTime('place', ['lunch', 'dinner'])).toBe('18:30')
  })

  it('식사 시간이 없거나 액티비티면 빈 값', () => {
    expect(defaultPlannedTime('place', [])).toBe('')
    expect(defaultPlannedTime('place', null)).toBe('')
    expect(defaultPlannedTime('activity', ['dinner'])).toBe('')
  })
})
