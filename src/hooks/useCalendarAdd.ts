'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { resolveCalendarApp } from '@/lib/calendar/apps'
import { buildCalendarEvent, type CalendarItem, type CalendarTrack } from '@/lib/calendar/event'
import { useCalendarTitlePrefix } from './useCalendarTitlePrefix'

/**
 * "캘린더에 추가" 동작 한 벌 — 상세 블록 버튼·카드 ⋮ 메뉴·예정일 저장 직후 토스트가 공유한다.
 * - add(item): 기기 기준 캘린더(iOS 계열=애플 .ics, 그 외=구글 링크)로 바로 실행한다. 선택 UI 없음.
 *   단, 머리말을 한 번도 정한 적 없는 첫 실행이면 머리말 다이얼로그를 먼저 띄우고,
 *   그 다이얼로그가 끝나는 순간 이어서 실행한다(사용자는 "추가"를 누른 것이므로 한 번 더 누르게 하지 않는다).
 *   다이얼로그의 저장/취소는 문구에만 적용되고 캘린더 추가는 항상 진행된다 — 저장이면 그 문구로,
 *   취소(X·Esc·바깥 탭 포함)면 문구 없이. 방금 저장한 문구는 훅 상태에 반영되기 전이라 직접 넘긴다.
 * - prefixDialogProps: <CalendarTitlePrefixDialog {...prefixDialogProps} /> 에 그대로 펼친다.
 * 이벤트는 실행 시점에 만들어 항상 최신 머리말·origin 이 반영된다.
 */
export function useCalendarAdd(track: CalendarTrack) {
  const { prefix, needsIntro } = useCalendarTitlePrefix()
  // 머리말 다이얼로그가 열려 있는 동안 닫힌 뒤 이어서 추가할 항목(null 이면 닫힘)
  const [pendingItem, setPendingItem] = useState<CalendarItem | null>(null)

  /** titlePrefix 를 넘기면 그 문구를 쓴다(방금 저장한 문구 — 훅 상태는 다음 렌더에야 바뀐다) */
  function run(item: CalendarItem, titlePrefix: string = prefix) {
    const event = buildCalendarEvent(track, item, {
      titlePrefix,
      origin: window.location.origin,
    })
    if (!event) {
      toast.error('캘린더에 추가할 날짜가 없어요')
      return
    }
    resolveCalendarApp().open(event)
  }

  function add(item: CalendarItem) {
    if (needsIntro) setPendingItem(item)
    else run(item)
  }

  return {
    add,
    prefixDialogProps: {
      open: pendingItem !== null,
      // 다이얼로그가 저장/취소 후("봤음" 표시와 문구 저장은 다이얼로그가 한다) 쓸 문구를 넘겨 준다.
      // 버튼 클릭과 같은 틱이라 다운로드·새 탭이 사용자 제스처로 인정된다.
      onResolve: (titlePrefix: string) => {
        const item = pendingItem
        setPendingItem(null)
        if (item) run(item, titlePrefix)
      },
    },
  }
}
