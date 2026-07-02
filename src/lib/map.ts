/**
 * 지도 앱 config — location(위치) 값을 각 지도 서비스의 검색 URL로 변환한다.
 *
 * 새 지도 앱(카카오맵·티맵 등)을 추가할 때는 이 배열에 항목만 추가하면
 * 폼·상세·선택 시트가 자동으로 반영한다(별도 UI 수정 불필요).
 */

/** 지도 앱 식별자. 새 앱은 MAP_APPS 배열에 추가만 하면 되도록 문자열 열림 타입. */
export type MapAppId = string

export interface MapApp {
  id: MapAppId
  label: string
  /** 검색어(위치 텍스트)를 받아 열 URL을 만든다. (웹 URL 또는 앱 스킴) */
  build: (query: string) => string
  /**
   * 웹 페이지가 없어 네이티브 앱 스킴(tmap:// 등)으로만 열리는 앱.
   * true 면 데스크탑 목록에서 숨기고, 모바일에서 앱 미설치 시 안내를 띄운다.
   */
  requiresApp?: boolean
}

export const MAP_APPS: MapApp[] = [
  {
    id: 'naver',
    label: '네이버지도',
    build: (q) => `https://map.naver.com/p/search/${encodeURIComponent(q)}`,
  },
  {
    id: 'kakao',
    label: '카카오맵',
    build: (q) => `https://map.kakao.com/link/search/${encodeURIComponent(q)}`,
  },
  {
    id: 'google',
    label: '구글지도',
    build: (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
  },
  {
    // 티맵은 웹 검색 페이지가 없어 앱 스킴만 지원한다.
    // 모바일에서 티맵 앱이 설치돼 있을 때만 열리고, 데스크탑/미설치 환경에서는 동작하지 않는다.
    id: 'tmap',
    label: '티맵',
    build: (q) => `tmap://search?name=${encodeURIComponent(q)}`,
    requiresApp: true,
  },
]

/** 저장된 선택이 없을 때의 기본 앱. */
export const DEFAULT_MAP_APP_ID: MapAppId = 'naver'

/** id로 앱을 찾되, 알 수 없는 값이면 첫 항목으로 폴백한다. */
export function getMapApp(id: MapAppId): MapApp {
  return MAP_APPS.find((app) => app.id === id) ?? MAP_APPS[0]
}
