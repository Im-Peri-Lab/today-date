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
 *   그 다이얼로그를 닫는 순간 이어서 실행한다(사용자는 "추가"를 누른 것이므로 한 번 더 누르게 하지 않는다).
 * - prefixDialogProps: <CalendarTitlePrefixDialog {...prefixDialogProps} /> 에 그대로 펼친다.
 * 이벤트는 실행 시점에 만들어 항상 최신 머리말·origin 이 반영된다.
 */
export function useCalendarAdd(track: CalendarTrack) {
  const { prefix, needsIntro } = useCalendarTitlePrefix()
  // 머리말 다이얼로그가 열려 있는 동안 닫힌 뒤 이어서 추가할 항목(null 이면 닫힘)
  const [pendingItem, setPendingItem] = useState<CalendarItem | null>(null)

  function run(item: CalendarItem) {
    const event = buildCalendarEvent(track, item, {
      titlePrefix: prefix,
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
      // 입력 폼 다이얼로그는 X 하나로 닫는다 — 어떻게 닫든("봤음" 표시는 다이얼로그가 한다) 보류한 추가를 이어 실행한다.
      // 닫기 클릭과 같은 틱이라 다운로드·새 탭이 사용자 제스처로 인정된다.
      onOpenChange: (open: boolean) => {
        if (open) return
        const item = pendingItem
        setPendingItem(null)
        if (item) run(item)
      },
    },
  }
}
