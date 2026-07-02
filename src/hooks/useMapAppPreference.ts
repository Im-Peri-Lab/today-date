'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_MAP_APP_ID, MAP_APPS, getMapApp, type MapApp, type MapAppId } from '@/lib/map'

const STORAGE_KEY = 'today-date:map-app'

/**
 * 마지막으로 선택한 지도 앱을 localStorage에 기억한다.
 * - 저장값이 없거나 알 수 없으면 기본 'naver'.
 * - SSR·localStorage 차단 환경에서도 안전하도록 try/catch로 감싼다.
 *   (초기 렌더는 항상 기본값 → 마운트 후 저장값으로 갱신 → hydration mismatch 없음)
 */
export function useMapAppPreference(): {
  app: MapApp
  appId: MapAppId
  setApp: (id: MapAppId) => void
} {
  const [appId, setAppId] = useState<MapAppId>(DEFAULT_MAP_APP_ID)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && MAP_APPS.some((app) => app.id === stored)) {
        setAppId(stored)
      }
    } catch {
      // 무시 (SSR / 차단 환경)
    }
  }, [])

  const setApp = useCallback((id: MapAppId) => {
    setAppId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // 무시 (차단 환경)
    }
  }, [])

  return { app: getMapApp(appId), appId, setApp }
}
