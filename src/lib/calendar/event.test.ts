import { describe, it, expect } from 'vitest'
import { buildCalendarEvent, getCalendarDates } from './event'
import type { Activity, Place } from '@/types'

const ORIGIN = 'https://today-date.example'

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    title: '한강 피크닉',
    category_id: 'c1',
    duration_bucket: null,
    time_of_day: 'any',
    location_type: 'outdoor',
    location: '여의도 한강공원',
    memo: '돗자리 챙기기',
    reference_url: 'blog.example.com/post',
    image_urls: [],
    status: 'wishlist',
    visited_at: null,
    visited_end_at: null,
    planned_at: '2026-11-07',
    rating: null,
    review_note: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    category: {
      id: 'c1', name: '야외', icon: null, color: null, sort_order: 0,
      is_default: true, is_hidden: false, created_at: '2026-01-01T00:00:00Z',
    },
    ...overrides,
  }
}

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: 'p1',
    title: '성수 브런치',
    category_id: null,
    area: '성수',
    location: null,
    meal_times: [],
    memo: null,
    reference_url: null,
    image_urls: [],
    status: 'wishlist',
    visited_at: null,
    planned_at: '2026-11-08',
    rating: null,
    review_note: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    category: null,
    ...overrides,
  }
}

describe('getCalendarDates', () => {
  it('위시리스트는 planned_at 하루', () => {
    expect(getCalendarDates('activity', activity())).toEqual({ start: '2026-11-07', end: '2026-11-07' })
  })

  it('위시리스트인데 planned_at 이 없으면 null (visited_at 은 보지 않는다)', () => {
    expect(getCalendarDates('activity', activity({ planned_at: null, visited_at: '2026-10-01' }))).toBeNull()
  })

  it('다녀온 activity 는 visited_at~visited_end_at 기간', () => {
    const item = activity({ status: 'visited', visited_at: '2026-10-01', visited_end_at: '2026-10-03' })
    expect(getCalendarDates('activity', item)).toEqual({ start: '2026-10-01', end: '2026-10-03' })
  })

  it('다녀온 place 는 단일일 (visited_end_at 이 있어도 무시)', () => {
    const item = { ...place({ status: 'visited', visited_at: '2026-10-01' }), visited_end_at: '2026-10-05' }
    expect(getCalendarDates('place', item as Place)).toEqual({ start: '2026-10-01', end: '2026-10-01' })
  })

  it('종료일이 시작일보다 빠르면 단일일로 접는다', () => {
    const item = activity({ status: 'visited', visited_at: '2026-10-05', visited_end_at: '2026-10-01' })
    expect(getCalendarDates('activity', item)).toEqual({ start: '2026-10-05', end: '2026-10-05' })
  })

  it('다녀왔는데 visited_at 이 없거나 보관(archived)이면 null', () => {
    expect(getCalendarDates('activity', activity({ status: 'visited', visited_at: null }))).toBeNull()
    expect(getCalendarDates('activity', activity({ status: 'archived' }))).toBeNull()
  })

  it('다녀온 곳이 되면 보존된 planned_at 은 쓰지 않는다', () => {
    const item = activity({ status: 'visited', visited_at: null, planned_at: '2026-11-07' })
    expect(getCalendarDates('activity', item)).toBeNull()
  })
})

describe('buildCalendarEvent', () => {
  it('날짜가 없으면 null', () => {
    expect(buildCalendarEvent('activity', activity({ planned_at: null }), { origin: ORIGIN })).toBeNull()
  })

  it('UID 는 track 을 포함해 같은 id 의 activity/place 가 충돌하지 않는다', () => {
    const a = buildCalendarEvent('activity', activity({ id: '42' }), { origin: ORIGIN })
    const p = buildCalendarEvent('place', place({ id: '42' }), { origin: ORIGIN })
    expect(a?.uid).toBe('activity-42@todaydate')
    expect(p?.uid).toBe('place-42@todaydate')
    expect(a?.uid).not.toBe(p?.uid)
  })

  it('제목 머리말을 앞에 붙이고, 공백뿐이면 무시한다', () => {
    expect(buildCalendarEvent('activity', activity(), { origin: ORIGIN, titlePrefix: '[데이트] ' })?.title).toBe(
      '[데이트] 한강 피크닉',
    )
    expect(buildCalendarEvent('activity', activity(), { origin: ORIGIN, titlePrefix: '   ' })?.title).toBe(
      '한강 피크닉',
    )
    expect(buildCalendarEvent('activity', activity(), { origin: ORIGIN })?.title).toBe('한강 피크닉')
  })

  it('장소: location 우선, 없으면 다이닝은 area, activity 는 빈 값', () => {
    expect(buildCalendarEvent('activity', activity(), { origin: ORIGIN })?.location).toBe('여의도 한강공원')
    expect(buildCalendarEvent('place', place({ location: '성수동 1가' }), { origin: ORIGIN })?.location).toBe('성수동 1가')
    expect(buildCalendarEvent('place', place(), { origin: ORIGIN })?.location).toBe('성수')
    expect(buildCalendarEvent('activity', activity({ location: null }), { origin: ORIGIN })?.location).toBe('')
  })

  it('메모에 메모·카테고리·참고 링크(스킴 보정)·상세 링크가 들어가고 별점·후기는 없다', () => {
    const ev = buildCalendarEvent('activity', activity({ rating: 5, review_note: '좋았다' }), { origin: ORIGIN })
    expect(ev?.description).toBe(
      [
        '돗자리 챙기기',
        '카테고리: 야외',
        '참고 링크: https://blog.example.com/post',
        `상세 보기: ${ORIGIN}/activities/a1`,
      ].join('\n'),
    )
  })

  it('다녀온 곳만 별점(★개수)과 후기를 추가한다', () => {
    const ev = buildCalendarEvent(
      'place',
      place({ status: 'visited', visited_at: '2026-10-01', rating: 4, review_note: '또 가고 싶다' }),
      { origin: ORIGIN },
    )
    expect(ev?.description).toBe(
      [`상세 보기: ${ORIGIN}/places/p1`, '별점: ★★★★', '후기: 또 가고 싶다'].join('\n'),
    )
    expect(ev?.startDate).toBe('2026-10-01')
    expect(ev?.endDate).toBe('2026-10-01')
  })

  it('메모·카테고리·링크가 없어도 상세 링크는 항상 들어간다', () => {
    const ev = buildCalendarEvent('place', place(), { origin: ORIGIN })
    expect(ev?.description).toBe(`상세 보기: ${ORIGIN}/places/p1`)
  })
})
