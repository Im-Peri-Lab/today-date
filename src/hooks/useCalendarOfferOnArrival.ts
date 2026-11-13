'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { takeCalendarOffer } from '@/lib/calendar/createOffer'
import type { CalendarItem, CalendarTrack } from '@/lib/calendar/event'
import { useCalendarAdd } from './useCalendarAdd'

/**
 * 등록(예정일 포함) 직후 상세에 도착했을 때 "캘린더에도 추가할까요?" 제안을 한 번 띄운다.
 * 목적지 자기확인 원칙(PR #51)에 따라 "등록했어요" 같은 성공 문구는 넣지 않고 다음 행동 제안만 둔다.
 * 표시 시간·액션 문구는 showScheduleSavedToast 의 "created" 제안과 맞춘다.
 *
 * 반환된 prefixDialogProps 는 상세 화면에 <CalendarTitlePrefixDialog> 로 펼쳐 마운트해야
 * [추가]를 처음 누를 때의 머리말 첫 안내 다이얼로그가 뜬다.
 */
export function useCalendarOfferOnArrival(track: CalendarTrack, id: string, item: CalendarItem | undefined) {
  const calendar = useCalendarAdd(track)
  // 토스트 액션은 띄울 때의 클로저를 들고 있으므로, 누르는 시점의 최신 add(머리말 상태 포함)를 ref로 부른다.
  // useStoredString 은 마운트 후에야 머리말 값을 읽으므로 띄울 때의 값이 오래됐을 수 있다.
  const addRef = useRef(calendar.add)
  useEffect(() => {
    addRef.current = calendar.add
  })

  const itemId = item?.id
  useEffect(() => {
    if (!item?.planned_at) return
    // one-shot: 새로고침·뒤로가기로 다시 들어와도 예약이 이미 지워져 있어 뜨지 않는다.
    if (!takeCalendarOffer(track, id)) return
    toast('캘린더에도 추가할까요?', {
      duration: 8000,
      action: { label: '추가', onClick: () => addRef.current(item) },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, id, itemId])

  return calendar.prefixDialogProps
}
