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
  /** 실행 직후 한 줄 안내 토스트(있을 때만). 다음 행동이 화면 밖(다운로드 파일 열기)에 있을 때 쓴다. */
  hint?: string
}

/** Android .ics 경로 안내 — 다운로드만 되고 캘린더 등록은 사용자가 파일을 열어야 이어진다. */
export const ANDROID_ICS_HINT = '다운로드된 파일을 열면 캘린더에 추가돼요'

function downloadEventIcs(event: CalendarEvent) {
  downloadIcsFile(buildIcs([event], nowStamp()), toIcsFilename(event.title))
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

/** 'YYYYMMDDTHHmmssZ' → epoch ms (Android intent 의 beginTime/endTime 용) */
function stampToMs(stamp: string): number {
  const m = stamp.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  if (!m) throw new Error(`stamp 해석 실패: ${stamp}`)
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number)
  return Date.UTC(y, mo - 1, d, h, mi, s)
}

/** 종일 일정은 Android CalendarContract 규칙대로 UTC 자정, 종료는 배타(+1일) */
function utcMidnightMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/**
 * Android intent URL — ACTION_INSERT + Events MIME 으로 기기 기본 캘린더 앱(삼성·구글 캘린더 등)의
 * "새 일정" 화면을 연다. 처리할 앱이 없으면 Chrome 이 S.browser_fallback_url(구글 웹 작성 화면)로 보낸다.
 * extra 값은 URL 인코딩한다(`;`·`#` 등 intent 구분자 충돌 방지).
 */
export function buildAndroidCalendarIntentUrl(event: CalendarEvent): string {
  let begin: number
  let end: number
  if (event.startTime) {
    const { start, end: endStamp } = timedEventStamps(event.startDate, event.startTime)
    begin = stampToMs(start)
    end = stampToMs(endStamp)
  } else {
    begin = utcMidnightMs(event.startDate)
    end = utcMidnightMs(nextDayIso(event.endDate))
  }
  const enc = encodeURIComponent
  const parts = [
    'action=android.intent.action.INSERT',
    'type=vnd.android.cursor.item/event',
    `S.title=${enc(event.title)}`,
    ...(event.location ? [`S.eventLocation=${enc(event.location)}`] : []),
    ...(event.description ? [`S.description=${enc(event.description)}`] : []),
    `l.beginTime=${begin}`,
    `l.endTime=${end}`,
    `B.allDay=${event.startTime ? 'false' : 'true'}`,
    `S.browser_fallback_url=${enc(buildGoogleCalendarUrl(event))}`,
  ]
  return `intent://#Intent;${parts.join(';')};end`
}

export const CALENDAR_APPS: CalendarApp[] = [
  {
    id: 'ics',
    label: '캘린더 파일(.ics)',
    // 애플 기기: 다운로드가 곧바로 네이티브 "캘린더에 추가" 시트로 이어져 안내가 필요 없다.
    open: downloadEventIcs,
  },
  {
    id: 'android-ics',
    label: '캘린더 파일(.ics, Android)',
    // Android 크롬·삼성 인터넷·PWA: 다운로드 → 파일 열기 → 앱 선택 → 등록 화면(실기기 확인).
    open: downloadEventIcs,
    hint: ANDROID_ICS_HINT,
  },
  {
    id: 'google',
    label: '구글 캘린더',
    open: (event) => openInNewTab(buildGoogleCalendarUrl(event)),
  },
  {
    id: 'android-intent',
    label: '기기 캘린더(Android 인앱)',
    // 카카오톡 인앱 브라우저 전용 — 크롬 계열은 intent:// 에 CATEGORY_BROWSABLE 을 붙이는데 캘린더 앱의
    // ACTION_INSERT 필터에는 BROWSABLE 이 없어 해석되지 않고 fallback 으로 간다(Chromium
    // ExternalNavigationHandler.sanitizeQueryIntentActivitiesIntent, 실기기 확인). 같은 창 이동이어야 한다.
    open: (event) => {
      window.location.href = buildAndroidCalendarIntentUrl(event)
    },
  },
]

/** id로 앱을 찾는다. 모르는 값이면 undefined(저장값 검증용). */
export function findCalendarApp(id: string | null | undefined): CalendarApp | undefined {
  return CALENDAR_APPS.find((app) => app.id === id)
}

/**
 * 이 기기의 기본 캘린더.
 * - 애플 기기(iOS·iPadOS·Mac) → .ics
 * - Android + 카카오톡 인앱 브라우저 → intent(앱 선택 + 등록 화면)
 * - 그 외 Android(크롬·삼성 인터넷·PWA) → .ics + 안내 토스트 (웹에서 INSERT intent 는 불가, .ics 가 최선)
 * - 그 외(PC 등) → 구글 웹
 * 브라우저 전용 — 클릭 핸들러 안에서만 호출한다.
 */
export function detectDefaultCalendarAppId(): CalendarAppId {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod|Macintosh/i.test(ua)) return 'ics'
  if (/android/i.test(ua)) return /KAKAOTALK/i.test(ua) ? 'android-intent' : 'android-ics'
  return 'google'
}

/** 지금 기기에서 실행할 캘린더 앱(감지 결과가 목록에 없으면 첫 항목). */
export function resolveCalendarApp(): CalendarApp {
  return findCalendarApp(detectDefaultCalendarAppId()) ?? CALENDAR_APPS[0]
}
