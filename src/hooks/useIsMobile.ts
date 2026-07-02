'use client'

import { useEffect, useState } from 'react'

/**
 * 모바일(iOS·Android) 여부. 앱 스킴 전용 지도앱(티맵)의 노출/동작 분기에 쓴다.
 * SSR·첫 렌더는 false → 마운트 후 userAgent로 갱신 (hydration mismatch 없음).
 * iPadOS 13+ 는 UA가 Mac으로 보고되므로 터치 포인트로 보정한다.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const mobile =
      /android|iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    setIsMobile(mobile)
  }, [])

  return isMobile
}
