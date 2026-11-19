import { describe, it, expect, vi } from 'vitest'
import {
  buildAndroidCalendarIntentUrl,
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
  it('apple-ics·google·android-intent 세 앱이 있고 id 가 유일하다', () => {
    const ids = CALENDAR_APPS.map((a) => a.id)
    expect(ids).toEqual(['apple-ics', 'google', 'android-intent'])
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

  it('애플 기기는 apple-ics, Android 는 android-intent, 그 외는 google', () => {
    withUa(IPHONE, () => expect(detectDefaultCalendarAppId()).toBe('apple-ics'))
    withUa(MAC, () => expect(detectDefaultCalendarAppId()).toBe('apple-ics'))
    withUa(ANDROID, () => expect(detectDefaultCalendarAppId()).toBe('android-intent'))
    withUa(WINDOWS, () => expect(detectDefaultCalendarAppId()).toBe('google'))
  })

  it('resolveCalendarApp 은 감지 결과의 앱을 돌려준다', () => {
    withUa(IPHONE, () => expect(resolveCalendarApp().id).toBe('apple-ics'))
    withUa(ANDROID, () => expect(resolveCalendarApp().id).toBe('android-intent'))
  })
})

describe('buildAndroidCalendarIntentUrl', () => {
  const extras = (url: string) =>
    Object.fromEntries(
      url
        .replace(/^intent:\/\/#Intent;/, '')
        .replace(/;end$/, '')
        .split(';')
        .map((p) => {
          const i = p.indexOf('=')
          return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]
        }),
    )

  it('ACTION_INSERT + Events MIME intent 이고 끝이 ;end 다', () => {
    const url = buildAndroidCalendarIntentUrl(base)
    expect(url.startsWith('intent://#Intent;')).toBe(true)
    expect(url.endsWith(';end')).toBe(true)
    const e = extras(url)
    expect(e.action).toBe('android.intent.action.INSERT')
    expect(e.type).toBe('vnd.android.cursor.item/event')
  })

  it('종일 일정은 UTC 자정 시작·배타 종료(+1일), allDay=true', () => {
    const e = extras(buildAndroidCalendarIntentUrl({ ...base, startDate: '2026-12-30', endDate: '2026-12-31' }))
    expect(e['l.beginTime']).toBe(String(Date.UTC(2026, 11, 30)))
    expect(e['l.endTime']).toBe(String(Date.UTC(2027, 0, 1)))
    expect(e['B.allDay']).toBe('true')
  })

  it('시간 지정 일정은 KST→UTC epoch, +120분, allDay=false', () => {
    const e = extras(buildAndroidCalendarIntentUrl({ ...base, startDate: '2026-12-19', endDate: '2026-12-19', startTime: '19:00' }))
    expect(e['l.beginTime']).toBe(String(Date.UTC(2026, 11, 19, 10, 0)))
    expect(e['l.endTime']).toBe(String(Date.UTC(2026, 11, 19, 12, 0)))
    expect(e['B.allDay']).toBe('false')
  })

  it('제목·장소·설명은 인코딩되어 구분자(;)와 충돌하지 않는다', () => {
    const url = buildAndroidCalendarIntentUrl({ ...base, title: 'A;B#C', description: '줄1\n줄2;끝' })
    const e = extras(url)
    expect(e['S.title']).toBe('A;B#C')
    expect(e['S.description']).toBe('줄1\n줄2;끝')
    expect(e['S.eventLocation']).toBe(base.location)
  })

  it('앱이 없을 때를 위해 구글 웹 작성 URL 을 fallback 으로 싣는다', () => {
    const e = extras(buildAndroidCalendarIntentUrl(base))
    expect(e['S.browser_fallback_url']).toBe(buildGoogleCalendarUrl(base))
  })

  it('빈 장소·설명은 extra 를 생략한다', () => {
    const url = buildAndroidCalendarIntentUrl({ ...base, location: '', description: '' })
    expect(url).not.toContain('S.eventLocation=')
    expect(url).not.toContain('S.description=')
  })
})
