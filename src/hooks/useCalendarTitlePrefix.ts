'use client'

import { useStoredString } from './useStoredString'

const STORAGE_KEY = 'today-date:calendar-title-prefix'
const INTRO_SEEN_KEY = 'today-date:calendar-prefix-intro-seen'

/**
 * 캘린더 일정 제목 앞에 붙일 머리말(예: "[데이트] ")을 localStorage에 기억한다.
 * 저장값이 없으면 빈 문자열(머리말 없음). 값은 공백까지 그대로 보관하고 적용한다.
 *
 * 최초 캘린더 추가 때 머리말 다이얼로그를 한 번만 띄우기 위한 "이미 봤음" 플래그도 여기서 관리한다.
 * 입력하고 닫든 비워 두고 닫든 markIntroSeen 이 불리면 이후로는 다시 뜨지 않는다.
 * 머리말이 이미 있으면(홈 메뉴에서 먼저 정한 경우 등) 플래그 없이도 소개가 필요 없다.
 */
export function useCalendarTitlePrefix(): {
  prefix: string
  setPrefix: (prefix: string) => void
  /** true 면 다음 캘린더 추가 전에 머리말 다이얼로그를 한 번 보여 준다 */
  needsIntro: boolean
  markIntroSeen: () => void
} {
  const [stored, setStored] = useStoredString(STORAGE_KEY)
  const [introSeen, setIntroSeen] = useStoredString(INTRO_SEEN_KEY)
  const prefix = stored ?? ''
  return {
    prefix,
    setPrefix: setStored,
    needsIntro: introSeen !== '1' && prefix === '',
    markIntroSeen: () => setIntroSeen('1'),
  }
}
