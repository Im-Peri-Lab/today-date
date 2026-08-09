'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { BrandHeader } from '@/components/auth/BrandHeader'
import styles from './NativeBootOverlay.module.css'

const MIN_VISIBLE_MS = 600
const FADE_MS = 250

/**
 * 네이티브(iOS/Android) 부팅 시 Capacitor 네이티브 스플래시를 이어받는 웹 오버레이.
 * PWA/브라우저에서는 Capacitor.isNativePlatform() 이 false 라 렌더되지 않는다.
 */
export function NativeBootOverlay() {
  const [visible, setVisible] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    setVisible(true)
    SplashScreen.hide()

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let fadeTimer: ReturnType<typeof setTimeout> | undefined

    const minVisibleTimer = setTimeout(() => {
      if (reduceMotion) {
        setVisible(false)
        return
      }
      setFadingOut(true)
      fadeTimer = setTimeout(() => setVisible(false), FADE_MS)
    }, MIN_VISIBLE_MS)

    return () => {
      clearTimeout(minVisibleTimer)
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`${styles.overlay} ${fadingOut ? styles.fadeOut : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <BrandHeader pulse />
    </div>
  )
}
