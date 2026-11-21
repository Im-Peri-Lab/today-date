'use client'

import { useCallback, useEffect, useRef } from 'react'

/** 선택 카드를 고른 뒤 다음 단계로 넘어가기까지 선택됨 틴트를 보여 주는 시간(SKILL §5 선택 후 자동 전환). */
export const SELECTION_ADVANCE_DELAY_MS = 150

/**
 * 위저드 자동 전환용 지연 실행 — 선택 즉시 화면이 바뀌면 누른 카드가 바로 사라져 눌림·선택 표시가
 * 보일 틈이 없다(iOS 짧은 탭 실기기 관찰). 선택값은 호출부가 즉시 반영하고, 단계 전환·히스토리 기록만
 * `schedule` 로 delayMs 뒤에 실행한다.
 *
 * - 대기 중 다시 `schedule` 하면 false 를 돌려주고 무시한다 → 연타·다른 카드 중복 선택으로 단계가
 *   두 번 넘어가지 않는다. 호출부는 false 일 때 선택값도 바꾸지 않아야 한다.
 * - 다른 경로로 단계가 바뀌는 곳(이전·다음 버튼, 처음부터, popstate)은 `cancel` 로 대기 전환을 버린다.
 * - 언마운트 시 타이머를 정리한다.
 */
export function useDelayedAdvance(delayMs: number = SELECTION_ADVANCE_DELAY_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const schedule = useCallback(
    (commit: () => void): boolean => {
      if (timerRef.current) return false
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        commit()
      }, delayMs)
      return true
    },
    [delayMs]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { schedule, cancel }
}
