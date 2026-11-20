/**
 * iOS 홈 화면 PWA 스플래시 — 단일 출처 (PROJECT_CONTEXT §20 "iOS PWA 스플래시").
 *
 * 이 파일 하나가 세 곳에서 같이 쓰인다. 값을 바꾸면 반드시 시작 이미지를 다시 만든다.
 *   1) src/app/layout.tsx — <head> 인라인 스크립트·스타일 + <body> 첫 자식 스플래시 마크업
 *   2) src/app/layout.tsx — metadata.appleWebApp.startupImage (기기별 시작 이미지 링크)
 *   3) scripts/generate-pwa-splash.mjs — 이 마크업을 기기 해상도별로 캡처해 public/splash/*.png 생성
 *      재생성: `node scripts/generate-pwa-splash.mjs`
 *
 * 모양·크기는 BrandHeader(=NativeBootOverlay=Android 네이티브 스플래시 캡처 원본)와 같다:
 * 하트 48px(같은 path, 색만 #1a1033 단색) + 간격 8px + "Today Date" 30px/500/-0.02em/line-height 1.1.
 * 타이틀은 폰트 로딩 전에도 같은 모양이 나오도록 Geist(wght 500) 글리프를 커닝 포함 SVG path 로 바꿔 넣었다.
 * 단일 색(라이트/다크 구분 없음): iOS 는 시작 이미지를 홈 화면 추가 시점 모드로 고정하므로, 모드별로 나누면
 * 현재 모드를 따르는 HTML 스플래시와 색이 어긋나 깜빡인다(실기기 확인, 261120).
 * 배경 = SKILL `--s-accent`(다크) #c084fc, 하트·타이틀 = `--s-ink` 계열 #1a1033(대비 6.82:1). 사용자 지정(261120).
 * 스플래시 동안 html 배경과 theme-color(상태바 영역)도 같은 색으로 맞추고, 걷을 때 원래 theme-color 로 되돌린다.
 *
 * 표시 조건: iOS 홈 화면 실행(navigator.standalone === true)이고 Capacitor 네이티브가 아닐 때만.
 * 일반 브라우저·Android PWA·Capacitor 앱에서는 display:none 이라 아무 영향이 없다.
 */

/** 스플래시 배경 — SKILL `--s-accent` 다크값. 마크(#1a1033)와 대비 6.82:1 */
export const PWA_SPLASH_BG = '#c084fc'
/** 하트·타이틀 색 — SKILL 본문 잉크 #1a1033 */
const PWA_SPLASH_INK = '#1a1033'
/** 스플래시 중이 아닐 때의 html 배경 — SKILL §1 "전역 html/body" (globals.css 와 같은 값) */
const HTML_BG_LIGHT = '#ffffff'
const HTML_BG_DARK = '#0a0712'

/**
 * 시작 이미지 대상 기기(세로). w×h = CSS px(포인트), dpr = 기기 배율.
 * 파일: public/splash/{w}x{h}@{dpr}x.png (픽셀 크기 w*dpr × h*dpr)
 */
export const PWA_SPLASH_DEVICES = [
  // iPhone
  { w: 440, h: 956, dpr: 3 }, // 16 Pro Max, 17 Pro Max
  { w: 420, h: 912, dpr: 3 }, // Air
  { w: 402, h: 874, dpr: 3 }, // 16 Pro, 17, 17 Pro
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max, 15 Plus·Pro Max, 16 Plus
  { w: 393, h: 852, dpr: 3 }, // 14 Pro, 15, 15 Pro, 16
  { w: 428, h: 926, dpr: 3 }, // 12·13 Pro Max, 14 Plus
  { w: 390, h: 844, dpr: 3 }, // 12, 12 Pro, 13, 13 Pro, 14, 16e
  { w: 375, h: 812, dpr: 3 }, // X, XS, 11 Pro, 12 mini, 13 mini
  { w: 414, h: 896, dpr: 3 }, // XS Max, 11 Pro Max
  { w: 414, h: 896, dpr: 2 }, // XR, 11
  { w: 414, h: 736, dpr: 3 }, // 6·7·8 Plus
  { w: 375, h: 667, dpr: 2 }, // 6·7·8, SE 2·3세대
  { w: 320, h: 568, dpr: 2 }, // SE 1세대
  // iPad
  { w: 1032, h: 1376, dpr: 2 }, // iPad Pro 13 (M4)
  { w: 1024, h: 1366, dpr: 2 }, // iPad Pro 12.9
  { w: 834, h: 1210, dpr: 2 }, // iPad Pro 11 (M4)
  { w: 834, h: 1194, dpr: 2 }, // iPad Pro 11
  { w: 820, h: 1180, dpr: 2 }, // iPad Air 10.9, iPad 10세대
  { w: 834, h: 1112, dpr: 2 }, // iPad Air 10.5
  { w: 810, h: 1080, dpr: 2 }, // iPad 10.2
  { w: 768, h: 1024, dpr: 2 }, // iPad 9.7, mini 5
  { w: 744, h: 1133, dpr: 2 }, // iPad mini 6
]

/** @param {{w:number,h:number,dpr:number}} d */
export function pwaSplashImagePath(d) {
  return `/splash/${d.w}x${d.h}@${d.dpr}x.png`
}

/** metadata.appleWebApp.startupImage 항목 — 기기당 한 장(색 모드 분기 없음). */
export function pwaStartupImages() {
  return PWA_SPLASH_DEVICES.map((d) => ({
    url: pwaSplashImagePath(d),
    media:
      `(device-width: ${d.w}px) and (device-height: ${d.h}px) and ` +
      `(-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: portrait)`,
  }))
}

/** 스플래시 동안 바꿔 둔 theme-color 를 원래 값으로 되돌린다(PwaSplashDismiss·안전장치 공용). */
export const PWA_SPLASH_RESTORE_THEME = `var m=document.querySelector('meta[name="theme-color"][data-pws-orig]');if(m){m.setAttribute('content',m.getAttribute('data-pws-orig'));m.removeAttribute('data-pws-orig')}`


/**
 * <head> 인라인 스크립트 — 첫 페인트 전에 실행된다.
 * - iOS 홈 화면 실행일 때만 html.pwa-splash 를 붙여 스플래시를 보이게 한다.
 * - 위치 보정은 하지 않는다. iOS 홈 화면 실행에서 이 앱은 상태바 아래까지 그려지므로(viewport-fit=cover)
 *   position:fixed; inset:0 이 이미 화면 전체 기준이고, 시작 이미지(화면 전체 기준 가운데)와 같은 자리다.
 *   예전엔 (screen.height - innerHeight)/2 만큼 올리는 보정을 했는데, 실기기(다이내믹 아일랜드)에서
 *   마크가 약 60pt 어긋나 두 세트로 겹쳐 보였다(261120) — 다시 넣지 말 것.
 * - theme-color(상태바 영역 색)를 스플래시 색으로 바꿔 둔다. 이 스크립트는 Next 가 출력한 theme-color meta 뒤에 온다.
 * - 안전장치: 하이드레이션이 끝내 안 되더라도 4초 뒤엔 스플래시를 걷어 콘텐츠를 가리지 않는다.
 */
export const PWA_SPLASH_HEAD_SCRIPT = `(function(){try{var n=window.navigator,c=window.Capacitor;if(n.standalone!==true)return;if(c&&typeof c.isNativePlatform==='function'&&c.isNativePlatform())return;var d=document.documentElement;d.classList.add('pwa-splash');var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('data-pws-orig',m.getAttribute('content')||'');m.setAttribute('content','${PWA_SPLASH_BG}')}setTimeout(function(){d.classList.add('pwa-splash-fade','pwa-splash-done');${PWA_SPLASH_RESTORE_THEME}},4000)}catch(e){}})();`

/** <head> 인라인 스타일 — html 배경을 CSS 번들보다 먼저 라이트/다크로 지정 + 스플래시 스타일. */
export const PWA_SPLASH_CSS = `html{background-color:${HTML_BG_LIGHT}}@media (prefers-color-scheme:dark){html:not(.light){background-color:${HTML_BG_DARK}}}html.pwa-splash:not(.pwa-splash-fade){background-color:${PWA_SPLASH_BG}}#pwa-splash{display:none}html.pwa-splash #pwa-splash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background-color:${PWA_SPLASH_BG};opacity:1;transition:opacity 250ms ease-out}html.pwa-splash-fade #pwa-splash{opacity:0;pointer-events:none}html.pwa-splash-done #pwa-splash{display:none}#pwa-splash .pws-mark{display:flex;flex-direction:column;align-items:center;gap:8px}#pwa-splash .pws-heart{display:block;width:48px;height:48px;filter:drop-shadow(0 4px 12px rgba(26,16,51,0.2))}#pwa-splash .pws-title{display:block;overflow:visible}@media (prefers-reduced-motion:reduce){html.pwa-splash #pwa-splash{transition:none}}`

const TITLE_W = 152.94
const TITLE_H = 33

/** <body> 첫 자식 마크업. aria-hidden — 스크린리더는 실제 화면만 읽는다. */
export const PWA_SPLASH_HTML = `<div class="pws-mark"><svg class="pws-heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="${PWA_SPLASH_INK}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><svg class="pws-title" width="${TITLE_W}" height="${TITLE_H}" viewBox="0 0 ${TITLE_W} ${TITLE_H}" aria-hidden="true"><path fill="${PWA_SPLASH_INK}" d="M7.32 8.67H0.78V5.7H17.1V8.67H10.56V27H7.32Z M16.47 19.02Q16.47 16.5 17.41 14.61Q18.36 12.72 20.07 11.7Q21.78 10.68 24.06 10.68Q26.31 10.68 28.02 11.7Q29.73 12.72 30.67 14.61Q31.62 16.5 31.62 19.02Q31.62 21.54 30.67 23.43Q29.73 25.32 28.02 26.34Q26.31 27.36 24.06 27.36Q21.78 27.36 20.07 26.34Q18.36 25.32 17.41 23.43Q16.47 21.54 16.47 19.02ZM28.32 19.02Q28.32 16.41 27.2 14.93Q26.07 13.44 24.06 13.44Q22.05 13.44 20.91 14.91Q19.77 16.38 19.77 19.02Q19.77 21.66 20.91 23.13Q22.05 24.6 24.06 24.6Q26.07 24.6 27.2 23.12Q28.32 21.63 28.32 19.02Z M33.48 19.02Q33.48 16.5 34.29 14.61Q35.1 12.72 36.61 11.7Q38.13 10.68 40.17 10.68Q41.82 10.68 43.09 11.37Q44.37 12.06 45.03 13.29V5.7H48.21V27H45.27L45.18 24.6Q44.52 25.89 43.18 26.62Q41.85 27.36 40.17 27.36Q38.13 27.36 36.61 26.34Q35.1 25.32 34.29 23.43Q33.48 21.54 33.48 19.02ZM45.03 19.02Q45.03 17.25 44.56 15.99Q44.1 14.73 43.2 14.09Q42.3 13.44 41.01 13.44Q39.06 13.44 37.92 14.93Q36.78 16.41 36.78 19.02Q36.78 21.6 37.93 23.1Q39.09 24.6 41.01 24.6Q42.27 24.6 43.18 23.94Q44.1 23.28 44.56 22.04Q45.03 20.79 45.03 19.02Z M51.21 23.01Q51.21 20.97 52.44 19.8Q53.67 18.63 56.31 18.12L61.8 17.07Q61.8 15.21 60.94 14.3Q60.09 13.38 58.38 13.38Q56.88 13.38 55.98 14.05Q55.08 14.73 54.78 16.05L51.48 15.84Q51.93 13.41 53.74 12.04Q55.56 10.68 58.38 10.68Q61.59 10.68 63.28 12.39Q64.98 14.1 64.98 17.25V23.46Q64.98 24.03 65.19 24.26Q65.4 24.48 65.85 24.48H66.42V27Q66.21 27.03 65.89 27.06Q65.58 27.09 65.25 27.09Q63.6 27.09 62.8 26.3Q62.01 25.5 62.01 23.61L62.34 23.76Q62.01 25.32 60.42 26.34Q58.83 27.36 56.67 27.36Q54.18 27.36 52.69 26.2Q51.21 25.05 51.21 23.01ZM61.8 20.49V19.47L57.15 20.37Q55.74 20.64 55.12 21.21Q54.51 21.78 54.51 22.71Q54.51 23.73 55.21 24.29Q55.92 24.84 57.21 24.84Q58.62 24.84 59.65 24.29Q60.69 23.73 61.24 22.74Q61.8 21.75 61.8 20.49Z M69.12 28.89H71.04Q71.82 28.89 72.22 28.65Q72.63 28.41 72.84 27.84L73.35 26.52H72.36L66.6 11.04H69.96L74.34 23.58L78.54 11.04H81.9L75.54 28.86Q75.06 30.24 74.12 30.87Q73.17 31.5 71.52 31.5H69.12Z M91.23 5.7H98.07Q103.08 5.7 105.78 8.47Q108.48 11.25 108.48 16.38Q108.48 21.48 105.82 24.24Q103.17 27 98.25 27H91.23ZM105.12 16.38Q105.12 12.51 103.36 10.59Q101.61 8.67 98.07 8.67H94.47V24.03H98.07Q101.61 24.03 103.36 22.12Q105.12 20.22 105.12 16.38Z M110.58 23.01Q110.58 20.97 111.81 19.8Q113.04 18.63 115.68 18.12L121.17 17.07Q121.17 15.21 120.31 14.3Q119.46 13.38 117.75 13.38Q116.25 13.38 115.35 14.05Q114.45 14.73 114.15 16.05L110.85 15.84Q111.3 13.41 113.11 12.04Q114.93 10.68 117.75 10.68Q120.96 10.68 122.66 12.39Q124.35 14.1 124.35 17.25V23.46Q124.35 24.03 124.56 24.26Q124.77 24.48 125.22 24.48H125.79V27Q125.58 27.03 125.26 27.06Q124.95 27.09 124.62 27.09Q122.97 27.09 122.17 26.3Q121.38 25.5 121.38 23.61L121.71 23.76Q121.38 25.32 119.79 26.34Q118.2 27.36 116.04 27.36Q113.55 27.36 112.06 26.2Q110.58 25.05 110.58 23.01ZM121.17 20.49V19.47L116.52 20.37Q115.11 20.64 114.49 21.21Q113.88 21.78 113.88 22.71Q113.88 23.73 114.58 24.29Q115.29 24.84 116.58 24.84Q117.99 24.84 119.02 24.29Q120.06 23.73 120.61 22.74Q121.17 21.75 121.17 20.49Z M128.7 22.68V7.29H131.88V22.44Q131.88 23.52 132.34 23.95Q132.81 24.39 133.83 24.39H136.11V27H133.14Q130.86 27 129.78 25.95Q128.7 24.9 128.7 22.68ZM126.27 11.04H136.11V13.65H126.27Z M137.43 19.02Q137.43 16.53 138.36 14.62Q139.29 12.72 140.97 11.7Q142.65 10.68 144.9 10.68Q147.09 10.68 148.74 11.69Q150.39 12.69 151.3 14.6Q152.22 16.5 152.22 19.14V19.95H140.76Q140.85 22.23 141.97 23.43Q143.1 24.63 145.02 24.63Q146.43 24.63 147.36 24Q148.29 23.37 148.68 22.2L151.98 22.41Q151.35 24.69 149.47 26.02Q147.6 27.36 144.99 27.36Q142.71 27.36 141 26.34Q139.29 25.32 138.36 23.43Q137.43 21.54 137.43 19.02ZM144.9 13.38Q143.19 13.38 142.09 14.46Q141 15.54 140.76 17.55H148.83Q148.68 15.48 147.64 14.43Q146.61 13.38 144.9 13.38Z"/></svg></div>`
