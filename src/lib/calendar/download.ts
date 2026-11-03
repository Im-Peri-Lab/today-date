/**
 * 클라이언트에서 .ics 텍스트를 Blob 으로 즉석 다운로드한다(서버 라우트·서명 토큰 없음).
 * iOS 에서는 standalone PWA 에서도 네이티브 "캘린더에 추가" 시트로 이어진다(실기기 확인됨).
 */
export function downloadIcsFile(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 곧바로 해제하면 iOS 에서 다운로드가 끊길 수 있어 여유를 둔다.
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/** 새 탭으로 URL 열기 — 동적 anchor 클릭이라 iOS standalone 에서도 사용자 제스처로 취급된다. */
export function openInNewTab(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** 파일명에 쓸 수 없는 문자를 걷어낸다. 비면 'event'. */
export function toIcsFilename(title: string): string {
  const base = title.replace(/[\\/:*?"<>|\r\n]+/g, ' ').trim().slice(0, 50).trim()
  return `${base || 'event'}.ics`
}
