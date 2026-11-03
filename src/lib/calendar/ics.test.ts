import { describe, it, expect } from 'vitest'
import { buildIcs, escapeIcsText, foldLine } from './ics'
import type { CalendarEvent } from './event'

const STAMP = '20261103T010203Z'

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    uid: 'activity-1@todaydate',
    title: '한강 피크닉',
    startDate: '2026-11-07',
    endDate: '2026-11-07',
    location: '',
    description: '',
    ...overrides,
  }
}

/** RFC 5545 unfold: CRLF + 공백/탭 제거 */
const unfold = (text: string) => text.replace(/\r\n[ \t]/g, '')
const byteLength = (s: string) => new TextEncoder().encode(s).length

describe('escapeIcsText', () => {
  it('쉼표·세미콜론을 이스케이프한다', () => {
    expect(escapeIcsText('a,b;c')).toBe('a\\,b\;c')
  })

  it('역슬래시를 먼저 이스케이프해 중복 이스케이프하지 않는다', () => {
    expect(escapeIcsText('a\\b')).toBe('a\\\\b')
    expect(escapeIcsText('a\\,b')).toBe('a\\\\\\,b')
  })

  it('LF·CRLF·CR 줄바꿈을 모두 리터럴 \\n 으로 바꾼다', () => {
    expect(escapeIcsText('a\nb\r\nc\rd')).toBe('a\\nb\\nc\\nd')
  })

  it('이스케이프할 것이 없으면 그대로 둔다', () => {
    expect(escapeIcsText('한강 피크닉')).toBe('한강 피크닉')
  })
})

describe('foldLine', () => {
  it('75바이트 이하는 접지 않는다', () => {
    const line = 'x'.repeat(75)
    expect(foldLine(line)).toBe(line)
  })

  it('긴 ASCII 줄을 접어도 물리 줄은 모두 75바이트 이하이고 unfold 하면 원본이다', () => {
    const line = 'DESCRIPTION:' + 'a'.repeat(300)
    const folded = foldLine(line)
    const physical = folded.split('\r\n')
    expect(physical.length).toBeGreaterThan(1)
    for (const p of physical) expect(byteLength(p)).toBeLessThanOrEqual(75)
    expect(physical.slice(1).every((p) => p.startsWith(' '))).toBe(true)
    expect(unfold(folded)).toBe(line)
  })

  it('한글(3바이트)·이모지(4바이트)를 한가운데서 자르지 않는다', () => {
    const line = 'SUMMARY:' + '가나다라마바사아자차카타파하'.repeat(6) + '🍣🍜'.repeat(10)
    const folded = foldLine(line)
    for (const p of folded.split('\r\n')) {
      expect(byteLength(p)).toBeLessThanOrEqual(75)
      expect(p).not.toContain('�')
    }
    expect(unfold(folded)).toBe(line)
  })
})

describe('buildIcs', () => {
  it('VCALENDAR 로 감싸고 모든 줄바꿈이 CRLF 이며 끝에도 CRLF 가 있다', () => {
    const ics = buildIcs([event()], STAMP)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true)
    expect(ics).not.toMatch(/(^|[^\r])\n/)
  })

  it('종일 일정 하루짜리는 DTEND 가 다음 날(배타)이다', () => {
    const ics = buildIcs([event()], STAMP)
    expect(ics).toContain('DTSTART;VALUE=DATE:20261107\r\n')
    expect(ics).toContain('DTEND;VALUE=DATE:20261108\r\n')
    expect(ics).toContain(`DTSTAMP:${STAMP}\r\n`)
  })

  it('기간 일정은 마지막 날 +1일이 DTEND 이고, 월·연 경계를 넘긴다', () => {
    const range = buildIcs([event({ startDate: '2026-10-30', endDate: '2026-11-02' })], STAMP)
    expect(range).toContain('DTSTART;VALUE=DATE:20261030\r\n')
    expect(range).toContain('DTEND;VALUE=DATE:20261103\r\n')

    const yearEnd = buildIcs([event({ startDate: '2026-12-31', endDate: '2026-12-31' })], STAMP)
    expect(yearEnd).toContain('DTEND;VALUE=DATE:20270101\r\n')
  })

  it('제목·장소·설명을 이스케이프해서 싣는다', () => {
    const ics = buildIcs(
      [event({ title: '강남, 맛집; 탐방', location: '서울\\강남', description: '1줄\n2줄' })],
      STAMP,
    )
    const flat = unfold(ics)
    expect(flat).toContain('SUMMARY:강남\\, 맛집\; 탐방\r\n')
    expect(flat).toContain('LOCATION:서울\\\\강남\r\n')
    expect(flat).toContain('DESCRIPTION:1줄\\n2줄\r\n')
  })

  it('장소·설명이 비면 해당 줄을 내보내지 않는다', () => {
    const ics = buildIcs([event()], STAMP)
    expect(ics).not.toContain('LOCATION')
    expect(ics).not.toContain('DESCRIPTION')
  })

  it('긴 설명도 물리 줄이 75바이트를 넘지 않는다', () => {
    const ics = buildIcs([event({ description: '메모 '.repeat(100) })], STAMP)
    for (const line of ics.split('\r\n')) expect(byteLength(line)).toBeLessThanOrEqual(75)
  })

  it('이벤트마다 UID 가 따로 실리고, track 이 다르면 같은 id 라도 UID 가 다르다', () => {
    const ics = buildIcs(
      [event({ uid: 'activity-7@todaydate' }), event({ uid: 'place-7@todaydate' })],
      STAMP,
    )
    const uids = ics.match(/^UID:.+$/gm)
    expect(uids).toEqual(['UID:activity-7@todaydate', 'UID:place-7@todaydate'])
    expect(new Set(uids).size).toBe(2)
  })
})
