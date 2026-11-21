'use client'

import { useCallback, useEffect, useRef } from 'react'

/** 선택 카드를 고른 뒤 다음 단계로 넘어가기까지 선택됨 틴트를 보여 주는 시간(SKILL §5 선택 후 자동 전환). */
export const SELECTION_ADVANCE_DELAY_MS = 150

/**
 * 자동 전환 직후 새 단계 카드가 포인터 탭을 받기 시작하는 시점(전환 후 ms).
 * 전환 "이전"에 시작된 탭은 무조건 거른다(아래 ①). 이 값은 보조 구간 ② — 더블탭의 두 번째 탭이
 * 렌더 직후에 시작되는 경우까지 막기 위한 것. 300ms 는 iOS 가 더블탭으로 묶는 간격과 같은 수준이고,
 * 새 질문을 보고 의도적으로 고르는 탭은 사람의 시각 반응 시간(~250ms+)상 이보다 빠르기 어렵다.
 */
export const ADVANCE_TAP_GUARD_MS = 300

type ClickLike = { detail: number }

/**
 * 위저드 자동 전환용 지연 실행 — 선택 즉시 화면이 바뀌면 누른 카드가 바로 사라져 눌림·선택 표시가
 * 보일 틈이 없다(iOS 짧은 탭 실기기 관찰). 선택값은 호출부가 즉시 반영하고, 단계 전환·히스토리 기록만
 * `schedule` 로 delayMs 뒤에 실행한다.
 *
 * - 대기 중 다시 `schedule` 하면 false 를 돌려주고 무시한다 → 연타·다른 카드 중복 선택으로 단계가
 *   두 번 넘어가지 않는다. 호출부는 false 일 때 선택값도 바꾸지 않아야 한다.
 * - 전환 뒤 새 단계로 새는 탭 차단: 선택 카드에 `onPointerDown` 을 달고 `schedule(commit, event)` 로
 *   클릭 이벤트를 넘기면, 포인터 탭(event.detail > 0)은 그 pointerdown 이 직전 자동 전환 시점 +
 *   guardMs 이후일 때만 받는다. ① 이전 단계에서 시작된 탭(pointerdown 이 전환 전) ② 전환 직후
 *   guardMs 안에 시작된 더블탭의 두 번째 탭 — 둘 다 거른다. 키보드 선택(detail 0)과 자동 전환이
 *   한 번도 없었던 첫 단계는 영향 없음. 각 단계에서 새로 누르는 정상 연속 선택은 막지 않는다.
 * - 다른 경로로 단계가 바뀌는 곳(이전·다음 버튼, 처음부터, popstate)은 `cancel` 로 대기 전환을 버린다.
 * - 언마운트 시 타이머를 정리한다.
 */
export function useDelayedAdvance(
  delayMs: number = SELECTION_ADVANCE_DELAY_MS,
  guardMs: number = ADVANCE_TAP_GUARD_MS
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advancedAtRef = useRef(-Infinity)
  const pointerDownAtRef = useRef(-Infinity)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const onPointerDown = useCallback(() => {
    pointerDownAtRef.current = performance.now()
  }, [])

  const schedule = useCallback(
    (commit: () => void, event?: ClickLike): boolean => {
      if (timerRef.current) return false
      if (event && event.detail > 0 && pointerDownAtRef.current < advancedAtRef.current + guardMs) {
        return false
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        commit()
        advancedAtRef.current = performance.now()
      }, delayMs)
      return true
    },
    [delayMs, guardMs]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { schedule, cancel, onPointerDown }
}
