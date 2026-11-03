'use client'

import { useCallback, useEffect, useState } from 'react'

const SYNC_EVENT = 'today-date:stored-string'

/**
 * localStorage 문자열 하나를 읽고 쓰는 훅(useMapAppPreference 와 같은 규칙).
 * - 초기 렌더는 항상 null → 마운트 후 저장값으로 갱신 → hydration mismatch 없음.
 * - SSR·localStorage 차단 환경에서도 안전하도록 try/catch.
 * - 한 화면에 이 훅 인스턴스가 여럿(블록 버튼·다이얼로그·카드)이라, 한 곳에서 저장하면
 *   같은 창의 다른 인스턴스도 갱신되도록 커스텀 이벤트로 알린다(다른 탭은 storage 이벤트).
 */
export function useStoredString(key: string): [string | null, (value: string) => void] {
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    const read = () => {
      try {
        setValue(localStorage.getItem(key))
      } catch {
        // 무시 (SSR / 차단 환경)
      }
    }
    const onSync = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) read()
    }
    read()
    window.addEventListener(SYNC_EVENT, onSync)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync)
      window.removeEventListener('storage', read)
    }
  }, [key])

  const set = useCallback(
    (next: string) => {
      setValue(next)
      try {
        localStorage.setItem(key, next)
      } catch {
        // 무시 (차단 환경)
      }
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: key }))
    },
    [key],
  )

  return [value, set]
}
