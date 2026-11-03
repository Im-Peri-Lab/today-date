/**
 * 캘린더 앱 config — MAP_APPS(lib/map.ts)와 비슷한 구조. 사용자가 고르는 UI는 없고
 * 기기 감지(detectDefaultCalendarAppId)로 하나가 정해진다. 새 캘린더를 지원할 때는 이 배열에
 * 항목을 넣고 감지 규칙을 확장한다.
 * 지도 앱은 URL 하나로 모두 열리지만 애플(.ics)은 다운로드라 `build` 대신 `open` 으로 실행한다.
 */
import { nextDayIso } from '@/lib/date'
import { downloadIcsFile, openInNewTab, toIcsFilename } from './download'
import type { CalendarEvent } from './event'
import { buildIcs } from './ics'
import { timedEventStamps } from './time'

/** 캘린더 앱 식별자. MAP_APPS 와 같이 문자열 열림 타입. */
export type CalendarAppId = string

export interface CalendarApp {
  id: CalendarAppId
  label: string
  /** 이벤트를 이 캘린더로 보낸다(사용자 제스처 안에서 동기 호출) */
  open: (event: CalendarEvent) => void
}

/** 'YYYYMMDDTHHMMSSZ' — DTSTAMP 용. 지금 시각이라 이 함수만 시계를 읽는다. */
function nowStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * 구글 dates 값. 시간 지정 일정은 `YYYYMMDDTHHmmssZ/YYYYMMDDTHHmmssZ`(UTC), 종일은 `YYYYMMDD/YYYYMMDD`.
 */
function googleDates(event: CalendarEvent): string {
  if (event.startTime) {
    const { start, end } = timedEventStamps(event.startDate, event.startTime)
    return `${start}/${end}`
  }
  return `${event.startDate.replace(/-/g, '')}/${nextDayIso(event.endDate).replace(/-/g, '')}`
}

/**
 * 구글 캘린더 이벤트 작성 URL. 종일 일정은 `YYYYMMDD/YYYYMMDD` 이고 종료일은 배타(+1일).
 * dates 의 `/` 는 구분자라 인코딩하지 않는다.
 */
export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const enc = encodeURIComponent
  const params = [
    'action=TEMPLATE',
    `text=${enc(event.title)}`,
    `dates=${googleDates(event)}`,
    ...(event.description ? [`details=${enc(event.description)}`] : []),
    ...(event.location ? [`location=${enc(event.location)}`] : []),
  ]
  return `https://calendar.google.com/calendar/render?${params.join('&')}`
}

export const CALENDAR_APPS: CalendarApp[] = [
  {
    id: 'apple-ics',
    label: '애플 캘린더',
    open: (event) => downloadIcsFile(buildIcs([event], nowStamp()), toIcsFilename(event.title)),
  },
  {
    id: 'google',
    label: '구글 캘린더',
    open: (event) => openInNewTab(buildGoogleCalendarUrl(event)),
  },
]

/** id로 앱을 찾는다. 모르는 값이면 undefined(저장값 검증용). */
export function findCalendarApp(id: string | null | undefined): CalendarApp | undefined {
  return CALENDAR_APPS.find((app) => app.id === id)
}

/**
 * 이 기기의 기본 캘린더. 애플 기기(iOS·iPadOS·Mac)면 애플, 그 외는 구글.
 * 브라우저 전용 — 클릭 핸들러 안에서만 호출한다.
 */
export function detectDefaultCalendarAppId(): CalendarAppId {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod|Macintosh/i.test(ua) ? 'apple-ics' : 'google'
}

/** 지금 기기에서 실행할 캘린더 앱(감지 결과가 목록에 없으면 첫 항목). */
export function resolveCalendarApp(): CalendarApp {
  return findCalendarApp(detectDefaultCalendarAppId()) ?? CALENDAR_APPS[0]
}
