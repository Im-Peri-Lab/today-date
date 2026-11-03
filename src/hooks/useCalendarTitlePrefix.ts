'use client'

import { useStoredString } from './useStoredString'

const STORAGE_KEY = 'today-date:calendar-title-prefix'

/**
 * 캘린더 일정 제목 앞에 붙일 머리말(예: "[데이트] ")을 localStorage에 기억한다.
 * 저장값이 없으면 빈 문자열(머리말 없음). 값은 공백까지 그대로 보관하고 적용한다.
 */
export function useCalendarTitlePrefix(): {
  prefix: string
  setPrefix: (prefix: string) => void
} {
  const [stored, setStored] = useStoredString(STORAGE_KEY)
  return { prefix: stored ?? '', setPrefix: setStored }
}
