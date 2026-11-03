import { describe, it, expect } from 'vitest'
import { plannedTimePayload } from './plannedTime'

describe('plannedTimePayload', () => {
  it('시간 칸을 비운 채 저장하면 null(종일)', () => {
    expect(plannedTimePayload('2026-12-19', '')).toBeNull()
    expect(plannedTimePayload('2026-12-19', undefined)).toBeNull()
  })

  it('값을 넣었다가 × 로 지우면(빈 문자열) null', () => {
    let time = '19:00'
    expect(plannedTimePayload('2026-12-19', time)).toBe('19:00')
    time = '' // × → onChange('')
    expect(plannedTimePayload('2026-12-19', time)).toBeNull()
  })

  it('날짜가 없으면 시간이 남아 있어도 null(날짜 없이 시간만 보내지 않음)', () => {
    expect(plannedTimePayload('', '19:00')).toBeNull()
    expect(plannedTimePayload(null, '19:00')).toBeNull()
  })
})
