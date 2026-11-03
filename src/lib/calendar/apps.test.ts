import { describe, it, expect } from 'vitest'
import { buildGoogleCalendarUrl, CALENDAR_APPS, findCalendarApp } from './apps'
import type { CalendarEvent } from './event'

const base: CalendarEvent = {
  uid: 'place-1@todaydate',
  title: '성수 카페 & 브런치',
  startDate: '2026-11-07',
  endDate: '2026-11-07',
  location: '서울 성동구',
  description: '메모\n상세 보기: https://example.com/places/1',
}

describe('buildGoogleCalendarUrl', () => {
  it('종일 일정은 YYYYMMDD/다음날 형식이다', () => {
    const url = buildGoogleCalendarUrl(base)
    expect(url).toContain('dates=20261107/20261108')
  })

  it('기간 일정의 종료일은 마지막 날 +1일이다', () => {
    const url = buildGoogleCalendarUrl({ ...base, startDate: '2026-12-30', endDate: '2026-12-31' })
    expect(url).toContain('dates=20261230/20270101')
  })

  it('text·details·location 을 URL 인코딩한다', () => {
    const parsed = new URL(buildGoogleCalendarUrl(base))
    expect(parsed.origin + parsed.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(parsed.searchParams.get('action')).toBe('TEMPLATE')
    expect(parsed.searchParams.get('text')).toBe(base.title)
    expect(parsed.searchParams.get('details')).toBe(base.description)
    expect(parsed.searchParams.get('location')).toBe(base.location)
  })

  it('비어 있는 장소·설명은 파라미터를 생략한다', () => {
    const url = buildGoogleCalendarUrl({ ...base, location: '', description: '' })
    expect(url).not.toContain('location=')
    expect(url).not.toContain('details=')
  })
})

describe('CALENDAR_APPS', () => {
  it('apple-ics 와 google 두 앱이 있고 id 가 유일하다', () => {
    const ids = CALENDAR_APPS.map((a) => a.id)
    expect(ids).toEqual(['apple-ics', 'google'])
    expect(findCalendarApp('google')?.label).toBe('구글 캘린더')
    expect(findCalendarApp('nope')).toBeUndefined()
    expect(findCalendarApp(null)).toBeUndefined()
  })
})
