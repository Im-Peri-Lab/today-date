'use client'

import { useEffect, useState } from 'react'

/**
 * iOS **Safari**(엔진 기준) 여부. 앱 스킴 전용 지도앱(티맵)의 미설치 UX 분기에 쓴다.
 *
 * 왜 Safari만 따로 보는가:
 * - iOS Safari는 미설치 커스텀 스킴(`tmap://`)으로 top-level 이동하면
 *   "주소가 유효하지 않아…" **네이티브 오류 모달**을 즉시 띄운다.
 * - Chrome iOS(CriOS)·Android는 미설치 스킴이 조용히 실패 → 기존 timeout 토스트가 정상 동작.
 * 따라서 iOS Safari에서만 지도 앱이 제공하는 공식 HTTPS 브리지로 연결한다.
 *
 * 판정: iOS 기기(또는 UA가 Mac으로 보고되는 iPadOS 13+ 를 터치포인트로 보정) +
 * Safari 엔진 + Chrome/Firefox/Edge/Opera/구글앱 등 in-app·대체 브라우저 제외.
 * SSR·첫 렌더는 false → 마운트 후 갱신 (hydration mismatch 없음).
 */
export function useIsIosSafari(): boolean {
  const [isIosSafari, setIsIosSafari] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const isIos =
      /iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    // CriOS(Chrome)·FxiOS(Firefox)·EdgiOS(Edge)·OPiOS/OPT(Opera)·GSA(구글앱) 등
    // iOS 대체 브라우저·in-app 웹뷰는 순정 Safari가 아니므로 제외.
    const isRealSafari =
      /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT|GSA|DuckDuckGo/i.test(ua)
    setIsIosSafari(isIos && isRealSafari)
  }, [])

  return isIosSafari
}
