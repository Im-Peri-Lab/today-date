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
   * iOS Safari에서 사용할 공식 HTTPS 앱 연결 페이지.
   * 커스텀 스킴의 설치 여부를 Safari에서 직접 판별할 수 없을 때만 사용한다.
   */
  buildIosSafari?: (query: string) => string
  /**
   * 웹 페이지가 없어 네이티브 앱 스킴(tmap:// 등)으로만 열리는 앱.
   * true 면 데스크탑 목록에서 숨긴다(웹에서 안 열림).
   * 모바일 미설치 UX는 브라우저별 한계가 있어 MapLink에서 분기한다(안내 문구는
   * requiresApp 앱 공통 "{앱명} 앱을 설치해 주세요." — installPrompt):
   * - Chrome iOS·Android: 스킴 이동 후 미설치면 timeout 토스트로 안내.
   * - iOS Safari: 앱이 제공하는 공식 HTTPS 브리지에서 앱 실행/다운로드를 처리.
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
    // Android·기타 모바일 브라우저는 앱 스킴을 직접 실행한다.
    // iOS Safari는 TMAP 공식 브리지가 올바른 iOS 스킴(tmap://?search=...)을 실행하고,
    // 미설치 시 공식 다운로드 안내 화면을 제공한다.
    id: 'tmap',
    label: '티맵',
    build: (q) => `tmap://search?name=${encodeURIComponent(q)}`,
    buildIosSafari: (q) =>
      `https://www.tmap.co.kr/tmap2/mobile/search.jsp?name=${encodeURIComponent(q)}`,
    requiresApp: true,
  },
]

/** 저장된 선택이 없을 때의 기본 앱. */
export const DEFAULT_MAP_APP_ID: MapAppId = 'naver'

/** id로 앱을 찾되, 알 수 없는 값이면 첫 항목으로 폴백한다. */
export function getMapApp(id: MapAppId): MapApp {
  return MAP_APPS.find((app) => app.id === id) ?? MAP_APPS[0]
}
