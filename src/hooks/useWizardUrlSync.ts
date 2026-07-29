'use client'

import { useEffect, useRef } from 'react'

/**
 * 활동/다이닝 위저드 공통 URL↔state 동기화 배선 — 마운트 시 1회, popstate(브라우저/OS
 * 뒤로가기, 모바일 스와이프 포함) 발생마다 handler를 호출한다. handler는 매 렌더마다 새로
 * 만들어져도 되며(ref로 항상 최신 버전을 유지) 별도 deps 배열을 신경 쓸 필요가 없다 — handler
 * 안에서 최신 컴포넌트 state(예: 결과가 메모리에 남아있는지)를 그대로 클로저로 참조해도 된다.
 *
 * source로 두 시점을 구분한다: 'mount'는 컴포넌트가 새로 마운트된 시점(결과 데이터가 메모리에
 * 없어 sessionStorage 캐시 복원이나 재조회 폴백이 필요할 수 있음), 'popstate'는 이미 마운트된
 * 채로 히스토리만 이동한 시점(결과 데이터가 메모리에 남아있으면 캐시를 다시 보지 않고 그대로
 * 재사용).
 */
export function useWizardUrlSync<S>(
  readUrlState: (search: string) => S,
  handler: (next: S, source: 'mount' | 'popstate') => void
) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    handlerRef.current(readUrlState(window.location.search), 'mount')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onPopState() {
      handlerRef.current(readUrlState(window.location.search), 'popstate')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
