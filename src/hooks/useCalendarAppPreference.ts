'use client'

import { findCalendarApp, type CalendarApp, type CalendarAppId } from '@/lib/calendar/apps'
import { useStoredString } from './useStoredString'

const STORAGE_KEY = 'today-date:calendar-app'

/**
 * 마지막으로 선택한 캘린더 앱을 localStorage에 기억한다(useMapAppPreference 패턴).
 * 지도와 달리 기본값이 없다 — 저장값이 없거나 알 수 없으면 app 이 null 이고,
 * 호출부(CalendarAddButton)는 그때 선택 시트를 먼저 띄운다.
 */
export function useCalendarAppPreference(): {
  app: CalendarApp | null
  setApp: (id: CalendarAppId) => void
} {
  const [stored, setStored] = useStoredString(STORAGE_KEY)
  return { app: findCalendarApp(stored) ?? null, setApp: setStored }
}
