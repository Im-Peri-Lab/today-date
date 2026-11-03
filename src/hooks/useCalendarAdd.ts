'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  detectDefaultCalendarAppId,
  findCalendarApp,
  type CalendarApp,
  type CalendarAppId,
} from '@/lib/calendar/apps'
import { buildCalendarEvent, type CalendarItem, type CalendarTrack } from '@/lib/calendar/event'
import { useCalendarAppPreference } from './useCalendarAppPreference'
import { useCalendarTitlePrefix } from './useCalendarTitlePrefix'

/**
 * "캘린더에 추가" 동작 한 벌 — 상세 블록 버튼·카드 ⋮ 메뉴·예정일 저장 직후 토스트가 공유한다.
 * - add(item): 기억된 캘린더로 바로 실행. 기억된 게 없으면(최초) 기기 기준 기본 캘린더(iOS=애플,
 *   그 외=구글)로 바로 실행하고 그 선택을 기록한다 — 시트를 강제로 띄우지 않는다.
 * - openSheet(item): ▾ — 재선택 전용 시트. 시트는 이 경로로만 열린다.
 * - sheetProps: <CalendarAppSheet {...sheetProps} /> 에 그대로 펼친다.
 * 이벤트는 실행 시점에 만들어 항상 최신 머리말·origin 이 반영된다.
 */
export function useCalendarAdd(track: CalendarTrack) {
  const { app, setApp } = useCalendarAppPreference()
  const { prefix, setPrefix } = useCalendarTitlePrefix()
  // 시트가 열려 있는 동안 추가 대상 항목(null 이면 닫힘)
  const [sheetItem, setSheetItem] = useState<CalendarItem | null>(null)

  function run(item: CalendarItem, target: CalendarApp, titlePrefix: string) {
    const event = buildCalendarEvent(track, item, {
      titlePrefix,
      origin: window.location.origin,
    })
    if (!event) {
      toast.error('캘린더에 추가할 날짜가 없어요')
      return
    }
    target.open(event)
  }

  function add(item: CalendarItem) {
    if (app) {
      run(item, app, prefix)
      return
    }
    // 최초: 기기 판별 결과를 기록해 두 번째부터는 "기억된 선택"과 똑같이 동작시킨다(재판별 없음).
    const detected = findCalendarApp(detectDefaultCalendarAppId())
    if (!detected) return
    setApp(detected.id)
    run(item, detected, prefix)
  }

  function openSheet(item: CalendarItem) {
    setSheetItem(item)
  }

  function handleConfirm(appId: CalendarAppId, nextPrefix: string) {
    const target = findCalendarApp(appId)
    if (!target || !sheetItem) return
    setApp(appId)
    setPrefix(nextPrefix)
    setSheetItem(null)
    // 확인 버튼 클릭과 같은 틱에서 실행 — 다운로드·새 탭이 사용자 제스처로 인정된다.
    run(sheetItem, target, nextPrefix)
  }

  return {
    add,
    openSheet,
    sheetProps: {
      open: sheetItem !== null,
      onOpenChange: (open: boolean) => {
        if (!open) setSheetItem(null)
      },
      initialAppId: app?.id ?? null,
      initialPrefix: prefix,
      onConfirm: handleConfirm,
    },
  }
}
