'use client'

import { useEffect } from 'react'

const FADE_MS = 250

/** head 스크립트가 스플래시 색으로 바꿔 둔 theme-color(상태바 영역)를 원래 값으로 되돌린다. */
function restoreThemeColor() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-pws-orig]')
  if (!meta) return
  meta.setAttribute('content', meta.getAttribute('data-pws-orig') ?? '')
  meta.removeAttribute('data-pws-orig')
}

/**
 * iOS 홈 화면 PWA 스플래시(pwaSplash.mjs)를 첫 화면 하이드레이션 직후 페이드아웃한다.
 * 최소 노출 시간은 두지 않는다 — 실제 화면이 준비되면 바로 걷는다.
 * html.pwa-splash 가 없으면(일반 브라우저·Android·Capacitor) 아무 일도 하지 않는다.
 */
export function PwaSplashDismiss() {
  useEffect(() => {
    const root = document.documentElement
    if (!root.classList.contains('pwa-splash') || root.classList.contains('pwa-splash-done')) return

    let fadeTimer: ReturnType<typeof setTimeout> | undefined
    // 하이드레이션된 첫 프레임이 실제로 그려진 뒤에 걷는다(rAF 두 번).
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.add('pwa-splash-fade')
        restoreThemeColor()
        fadeTimer = setTimeout(() => root.classList.add('pwa-splash-done'), FADE_MS)
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [])

  return null
}
