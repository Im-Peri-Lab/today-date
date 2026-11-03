import { describe, it, expect, vi } from 'vitest'
import {
  buildGoogleCalendarUrl,
  CALENDAR_APPS,
  detectDefaultCalendarAppId,
  findCalendarApp,
  resolveCalendarApp,
} from './apps'
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

  it('시간 지정 일정은 dates=YYYYMMDDTHHmmssZ/…(UTC, +120분)', () => {
    const url = buildGoogleCalendarUrl({ ...base, startDate: '2026-12-19', endDate: '2026-12-19', startTime: '19:00' })
    expect(url).toContain('dates=20261219T100000Z/20261219T120000Z')
    expect(new URL(url).searchParams.get('dates')).toBe('20261219T100000Z/20261219T120000Z')
  })

  it('시간이 없으면 기존 종일 URL 과 같다', () => {
    expect(buildGoogleCalendarUrl(base)).toBe(
      buildGoogleCalendarUrl({ ...base, startTime: undefined }),
    )
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

describe('detectDefaultCalendarAppId / resolveCalendarApp', () => {
  const withUa = (ua: string, fn: () => void) => {
    vi.stubGlobal('navigator', { userAgent: ua })
    try {
      fn()
    } finally {
      vi.unstubAllGlobals()
    }
  }
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'
  const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'

  it('애플 기기는 apple-ics, 그 외는 google', () => {
    withUa(IPHONE, () => expect(detectDefaultCalendarAppId()).toBe('apple-ics'))
    withUa(MAC, () => expect(detectDefaultCalendarAppId()).toBe('apple-ics'))
    withUa(ANDROID, () => expect(detectDefaultCalendarAppId()).toBe('google'))
    withUa(WINDOWS, () => expect(detectDefaultCalendarAppId()).toBe('google'))
  })

  it('resolveCalendarApp 은 감지 결과의 앱을 돌려준다', () => {
    withUa(IPHONE, () => expect(resolveCalendarApp().id).toBe('apple-ics'))
    withUa(ANDROID, () => expect(resolveCalendarApp().id).toBe('google'))
  })
})
