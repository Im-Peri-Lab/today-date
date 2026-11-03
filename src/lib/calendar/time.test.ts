import { describe, it, expect } from 'vitest'
import { PLANNED_EVENT_DURATION_MINUTES, seoulToUtcStamp, timedEventStamps } from './time'

describe('timedEventStamps (Asia/Seoul → UTC, +120분)', () => {
  it('종료 길이는 120분 상수 하나', () => {
    expect(PLANNED_EVENT_DURATION_MINUTES).toBe(120)
  })

  it('12/19 19:00 → 10:00Z ~ 12:00Z', () => {
    expect(timedEventStamps('2026-12-19', '19:00')).toEqual({
      start: '20261219T100000Z',
      end: '20261219T120000Z',
    })
  })

  it('12/19 08:00 → 시작이 UTC 전날로 넘어간다', () => {
    expect(timedEventStamps('2026-12-19', '08:00').start).toBe('20261218T230000Z')
  })

  it('12/19 23:00 → 종료가 다음 날 16:00Z', () => {
    expect(timedEventStamps('2026-12-19', '23:00')).toEqual({
      start: '20261219T140000Z',
      end: '20261219T160000Z',
    })
  })

  it('12/31 23:30 → 종료는 KST 2027-01-01 01:30(해를 넘김), UTC 로는 12/31 16:30Z', () => {
    expect(timedEventStamps('2026-12-31', '23:30')).toEqual({
      start: '20261231T143000Z',
      end: '20261231T163000Z',
    })
  })

  it('UTC 기준으로 해를 넘기는 앞방향 이동도 처리한다(분 가산이 커지는 경우)', () => {
    // KST 2027-01-01 09:30 = UTC 2027-01-01 00:30
    expect(seoulToUtcStamp('2026-12-31', '23:30', 600)).toBe('20270101T003000Z')
  })

  it('1/1 00:30 → UTC 전년도 12/31', () => {
    expect(seoulToUtcStamp('2027-01-01', '00:30')).toBe('20261231T153000Z')
  })

  it('2028-02-29 07:00 → 윤년 2/28 22:00Z', () => {
    expect(seoulToUtcStamp('2028-02-29', '07:00')).toBe('20280228T220000Z')
  })

  it('3/1 07:00 → 윤년이 아니면 2/28, 윤년이면 2/29', () => {
    expect(seoulToUtcStamp('2027-03-01', '07:00')).toBe('20270228T220000Z')
    expect(seoulToUtcStamp('2028-03-01', '07:00')).toBe('20280229T220000Z')
  })
})
