'use client'

/**
 * [diag/android-calendar-check 전용 — 머지 금지]
 * 안드로이드 실기기에서 캘린더 추가 방식 4가지를 비교하는 진단 페이지. 로그인 없이 열린다(미들웨어 예외).
 * 이벤트·.ics·구글 URL·UTC 변환은 앱의 lib/calendar 함수를 그대로 쓴다. 앱 코드는 바꾸지 않는다.
 */
import { useEffect, useState } from 'react'
import { buildGoogleCalendarUrl } from '@/lib/calendar/apps'
import { downloadIcsFile, openInNewTab, toIcsFilename } from '@/lib/calendar/download'
import type { CalendarEvent } from '@/lib/calendar/event'
import { buildIcs } from '@/lib/calendar/ics'
import { timedEventStamps } from '@/lib/calendar/time'
import { nextDayIso } from '@/lib/date'

const ALL_DAY: CalendarEvent = {
  uid: 'diag-allday@todaydate',
  title: '[진단] 종일 일정',
  startDate: '2026-12-19',
  endDate: '2026-12-19',
  location: '서울 성동구 성수동',
  description: '진단용 종일 일정\n상세 보기: https://today-date-seven.vercel.app',
}
const TIMED: CalendarEvent = {
  ...ALL_DAY,
  uid: 'diag-timed@todaydate',
  title: '[진단] 19:00 저녁 예약',
  startTime: '19:00',
  description: '진단용 시간 지정 일정(19:00~21:00 KST)',
}
const SAMPLES = [
  { key: 'allday', label: '종일 (2026-12-19)', event: ALL_DAY },
  { key: 'timed', label: '시간 지정 (2026-12-19 19:00, 2시간)', event: TIMED },
]

/** 'YYYYMMDDTHHmmssZ' → epoch ms (intent 의 beginTime/endTime 용) */
function stampToMs(stamp: string): number {
  const m = stamp.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  if (!m) throw new Error(`stamp 해석 실패: ${stamp}`)
  const [, y, mo, d, h, mi, s] = m.map(Number)
  return Date.UTC(y, mo - 1, d, h, mi, s)
}

/** 종일 일정은 Android CalendarContract 규칙대로 UTC 자정, 종료는 배타(+1일) */
function utcMidnightMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** 구글 캘린더 모바일 웹 편집 화면(eventedit) — 파라미터는 render?action=TEMPLATE 과 같은 dates 형식 */
function buildEventEditUrl(e: CalendarEvent): string {
  const enc = encodeURIComponent
  const dates = e.startTime
    ? (() => {
        const { start, end } = timedEventStamps(e.startDate, e.startTime!)
        return `${start}/${end}`
      })()
    : `${e.startDate.replace(/-/g, '')}/${nextDayIso(e.endDate).replace(/-/g, '')}`
  const params = [
    `text=${enc(e.title)}`,
    `dates=${dates}`,
    ...(e.description ? [`details=${enc(e.description)}`] : []),
    ...(e.location ? [`location=${enc(e.location)}`] : []),
  ]
  return `https://calendar.google.com/calendar/u/0/r/eventedit?${params.join('&')}`
}

/** Android intent URL — ACTION_INSERT + Events MIME. fallback 이 있으면 S.browser_fallback_url 추가 */
function buildIntentUrl(e: CalendarEvent, fallback?: string): string {
  let begin: number
  let end: number
  if (e.startTime) {
    const s = timedEventStamps(e.startDate, e.startTime)
    begin = stampToMs(s.start)
    end = stampToMs(s.end)
  } else {
    begin = utcMidnightMs(e.startDate)
    end = utcMidnightMs(nextDayIso(e.endDate))
  }
  // intent 의 extra 값은 URL 인코딩한다(;·# 등 구분자 충돌 방지)
  const enc = encodeURIComponent
  const parts = [
    'action=android.intent.action.INSERT',
    'type=vnd.android.cursor.item/event',
    `S.title=${enc(e.title)}`,
    `S.eventLocation=${enc(e.location)}`,
    `S.description=${enc(e.description)}`,
    `l.beginTime=${begin}`,
    `l.endTime=${end}`,
    `B.allDay=${e.startTime ? 'false' : 'true'}`,
    ...(fallback ? [`S.browser_fallback_url=${enc(fallback)}`] : []),
  ]
  return `intent://#Intent;${parts.join(';')};end`
}

type Log = { at: string; text: string; tone: 'info' | 'error' }

export default function CalendarDiagPage() {
  const [env, setEnv] = useState({ ua: '', standalone: '', platform: '' })
  const [logs, setLogs] = useState<Log[]>([])

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean; userAgentData?: { platform?: string; mobile?: boolean } }
    setEnv({
      ua: navigator.userAgent,
      standalone: `display-mode:standalone=${window.matchMedia('(display-mode: standalone)').matches} / navigator.standalone=${String(nav.standalone)}`,
      platform: nav.userAgentData ? `${nav.userAgentData.platform} mobile=${nav.userAgentData.mobile}` : '(userAgentData 없음)',
    })
    const onVis = () => log(`visibilitychange → ${document.visibilityState}`, 'info')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('error', (e) => log(`window.error: ${e.message}`, 'error'))
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  function log(text: string, tone: Log['tone'] = 'info') {
    const at = new Date().toLocaleTimeString('ko-KR', { hour12: false })
    setLogs((prev) => [{ at, text, tone }, ...prev].slice(0, 40))
  }

  /** 실행 후 1.5초 뒤에도 페이지가 보이면 "앱/새 화면으로 넘어가지 않은 것 같음"을 남긴다 */
  function run(name: string, fn: () => void) {
    log(`${name} 실행`)
    try {
      fn()
    } catch (err) {
      log(`${name} 예외: ${err instanceof Error ? err.message : String(err)}`, 'error')
      return
    }
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        log(`${name}: 1.5초 뒤에도 이 페이지가 보임(앱·새 탭으로 넘어가지 않았을 수 있음)`, 'error')
      }
    }, 1500)
  }

  /** intent 는 location 이동으로만 동작(새 탭 anchor 는 크롬이 막는 경우가 있어 같은 탭 이동) */
  function goIntent(url: string) {
    window.location.href = url
  }

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif', fontSize: 14, lineHeight: 1.5, maxWidth: 640, margin: '0 auto', color: '#111', background: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>캘린더 추가 진단</h1>
      <p style={{ color: '#666' }}>진단 전용 페이지(머지하지 않음). 각 버튼을 누른 뒤 무엇이 열렸는지 기록해 주세요.</p>

      <section style={{ marginTop: 12, padding: 12, background: '#f4f4f5', borderRadius: 8, wordBreak: 'break-all' }}>
        <div><b>UA</b>: {env.ua}</div>
        <div><b>standalone</b>: {env.standalone}</div>
        <div><b>userAgentData</b>: {env.platform}</div>
      </section>

      {SAMPLES.map(({ key, label, event }) => {
        const google = buildGoogleCalendarUrl(event)
        const editUrl = buildEventEditUrl(event)
        const intentUrl = buildIntentUrl(event)
        const intentFallbackUrl = buildIntentUrl(event, editUrl)
        const btn = { display: 'block', width: '100%', textAlign: 'left' as const, padding: '12px', marginTop: 8, border: '1px solid #ccc', borderRadius: 8, background: '#fff', fontSize: 14 }
        return (
          <section key={key} style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{label}</h2>
            <button style={btn} onClick={() => run(`[${key}] A .ics`, () => downloadIcsFile(buildIcs([event], '20261103T000000Z'), toIcsFilename(event.title)))}>
              A. Blob .ics 다운로드 (현재 iOS 경로)
            </button>
            <button style={btn} onClick={() => run(`[${key}] B eventedit`, () => openInNewTab(editUrl))}>
              B. 구글 캘린더 eventedit (새 탭)
            </button>
            <button style={btn} onClick={() => run(`[${key}] C intent`, () => goIntent(intentUrl))}>
              C. Android intent INSERT (fallback 없음)
            </button>
            <button style={btn} onClick={() => run(`[${key}] C2 intent+fallback`, () => goIntent(intentFallbackUrl))}>
              C2. Android intent INSERT + 실패 시 eventedit 로 (browser_fallback_url)
            </button>
            <button style={btn} onClick={() => run(`[${key}] D render`, () => openInNewTab(google))}>
              D. 현재 방식 render?action=TEMPLATE (새 탭, 비교용)
            </button>
            <details style={{ marginTop: 8, color: '#555', wordBreak: 'break-all', fontSize: 12 }}>
              <summary>생성된 URL 보기</summary>
              <p><b>B</b> {editUrl}</p>
              <p><b>C</b> {intentUrl}</p>
              <p><b>C2</b> {intentFallbackUrl}</p>
              <p><b>D</b> {google}</p>
            </details>
          </section>
        )
      })}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>로그 (최신 위)</h2>
        <button style={{ marginTop: 4, padding: '4px 8px' }} onClick={() => setLogs([])}>지우기</button>
        <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: 'none', fontSize: 12 }}>
          {logs.map((l, i) => (
            <li key={i} style={{ color: l.tone === 'error' ? '#b91c1c' : '#333', borderBottom: '1px solid #eee', padding: '4px 0' }}>
              {l.at} {l.text}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
