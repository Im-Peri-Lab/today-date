import { describe, it, expect } from 'vitest'
import {
  daysUntil,
  formatDday,
  formatDotDateTime,
  formatKoreanTime,
  nextDayIso,
  prevDayIso,
  todayKstIso,
  toHHmm,
} from './date'

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

describe('prevDayIso', () => {
  it('월·연 경계와 윤년을 거슬러 간다', () => {
    expect(prevDayIso('2026-11-03')).toBe('2026-11-02')
    expect(prevDayIso('2026-05-01')).toBe('2026-04-30')
    expect(prevDayIso('2027-01-01')).toBe('2026-12-31')
    expect(prevDayIso('2028-03-01')).toBe('2028-02-29')
    expect(prevDayIso('2027-03-01')).toBe('2027-02-28')
    expect(prevDayIso('2100-03-01')).toBe('2100-02-28')
  })

  it('해석할 수 없으면 그대로', () => {
    expect(prevDayIso('')).toBe('')
  })
})

describe('formatKoreanTime', () => {
  it('오전/오후 12시간제, 시는 앞자리 0 없이', () => {
    expect(formatKoreanTime('00:00')).toBe('오전 12:00')
    expect(formatKoreanTime('12:00')).toBe('오후 12:00')
    expect(formatKoreanTime('12:30')).toBe('오후 12:30')
    expect(formatKoreanTime('19:05')).toBe('오후 7:05')
    expect(formatKoreanTime('09:10')).toBe('오전 9:10')
  })

  it('DB 의 HH:mm:ss 도 받는다, 값이 없으면 빈 문자열', () => {
    expect(formatKoreanTime('19:00:00')).toBe('오후 7:00')
    expect(formatKoreanTime(null)).toBe('')
    expect(formatKoreanTime('')).toBe('')
  })
})

describe('formatDotDateTime / toHHmm', () => {
  it('상세 표시: 날짜(요일) + 오전/오후 시간, 시간 없으면 날짜만', () => {
    expect(formatDotDateTime('2026-12-19', '19:00')).toBe('2026.12.19 (토) 오후 7:00')
    expect(formatDotDateTime('2026-12-19', null)).toBe('2026.12.19 (토)')
  })

  it('toHHmm 은 초를 잘라낸다', () => {
    expect(toHHmm('19:00:00')).toBe('19:00')
    expect(toHHmm(null)).toBe('')
  })
})

describe('daysUntil / formatDday (위시리스트 카드 D-day)', () => {
  const dday = (iso: string, today: string) => formatDday(daysUntil(iso, today)!)

  it('오늘 / 내일 / 어제', () => {
    expect(dday('2026-11-21', '2026-11-21')).toBe('D-DAY')
    expect(dday('2026-11-22', '2026-11-21')).toBe('D-1')
    expect(dday('2026-11-20', '2026-11-21')).toBe('D+1')
  })

  it('월말 경계(30일·31일·2월·윤년)', () => {
    expect(dday('2026-12-01', '2026-11-30')).toBe('D-1')
    expect(dday('2026-11-30', '2026-12-01')).toBe('D+1')
    expect(dday('2027-02-01', '2027-01-31')).toBe('D-1')
    expect(dday('2027-03-01', '2027-02-28')).toBe('D-1')
    expect(dday('2028-03-01', '2028-02-28')).toBe('D-2') // 2028 윤년(2/29)
  })

  it('연말 경계', () => {
    expect(dday('2027-01-01', '2026-12-31')).toBe('D-1')
    expect(dday('2026-12-31', '2027-01-01')).toBe('D+1')
    expect(dday('2027-12-31', '2026-12-31')).toBe('D-365')
  })

  it('KST 자정 전후: todayKstIso 와 함께 쓰면 UTC 15:00 에 하루 줄어든다', () => {
    const before = todayKstIso(new Date('2026-11-20T14:59:59Z')) // KST 11-20 23:59:59
    const after = todayKstIso(new Date('2026-11-20T15:00:00Z')) // KST 11-21 00:00
    expect(dday('2026-11-21', before)).toBe('D-1')
    expect(dday('2026-11-21', after)).toBe('D-DAY')
  })

  it('해석할 수 없는 값은 null', () => {
    expect(daysUntil('', '2026-11-21')).toBeNull()
    expect(daysUntil('2026-11-21', 'bad')).toBeNull()
  })
})
