import { nextDayIso } from '@/lib/date'
import type { CalendarEvent } from './event'

/**
 * .ics(iCalendar, RFC 5545) 텍스트 생성 — 전부 순수 함수.
 * 쉼표·세미콜론·역슬래시·줄바꿈 이스케이프, 75옥텟 줄 접기, CRLF 를 여기서 책임진다.
 * (DTSTAMP 같은 "지금" 값은 호출부가 stamp 로 넘겨 이 모듈은 시계를 읽지 않는다.)
 */

const encoder = new TextEncoder()

/** TEXT 값 이스케이프: 역슬래시를 먼저 처리해야 뒤에서 붙인 역슬래시가 중복 이스케이프되지 않는다. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * 한 줄을 75옥텟(UTF-8 바이트) 이하로 접는다. 이어지는 줄은 CRLF + 공백으로 시작하며
 * 그 공백도 75옥텟에 포함된다(내용은 줄당 74바이트). 멀티바이트 문자(한글·이모지)는 코드포인트
 * 단위로 끊어 한가운데서 잘리지 않는다.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line

  const chunks: string[] = []
  let current = ''
  let bytes = 0
  let limit = 75
  for (const ch of line) {
    const size = encoder.encode(ch).length
    if (bytes + size > limit) {
      chunks.push(current)
      current = ''
      bytes = 0
      limit = 74
    }
    current += ch
    bytes += size
  }
  chunks.push(current)
  return chunks.join('\r\n ')
}

/** 'YYYY-MM-DD' → 'YYYYMMDD' (DATE 값 형식). */
function toIcsDate(iso: string): string {
  return iso.replace(/-/g, '')
}

/**
 * 종일 일정 VEVENT 한 건. DTEND 는 배타 종료일이라 마지막 날 +1일.
 * 빈 location/description 줄은 내보내지 않는다.
 */
function buildVEvent(event: CalendarEvent, stamp: string): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(event.startDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(nextDayIso(event.endDate))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    'END:VEVENT',
  ]
}

/**
 * VCALENDAR 전체 텍스트. 모든 줄바꿈은 CRLF 이고 끝에도 CRLF 가 붙는다.
 * @param stamp UTC 'YYYYMMDDTHHMMSSZ' (예: 20261103T010203Z)
 */
export function buildIcs(events: CalendarEvent[], stamp: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//today-date//calendar-export//KO',
    'CALSCALE:GREGORIAN',
    ...events.flatMap((event) => buildVEvent(event, stamp)),
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
