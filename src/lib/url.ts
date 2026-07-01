/**
 * 참고 링크 스킴 보정 유틸 (저장값은 원본 유지 — 여는 href·검증에만 사용).
 *
 * - 스킴이 없는 웹주소(`naver.com`, `www.naver.com/x`)에는 `https://`를 붙인다.
 * - 이미 `http://`·`https://` 등 authority 스킴이 있으면 그대로 둔다.
 * - `mailto:`·`tel:` 같은 비-슬래시 스킴도 그대로 둔다.
 *   (점 없는 스킴만 인정해 `host:8080` 같은 포트를 스킴으로 오인하지 않음)
 * - 빈 값은 그대로 반환(호출부에서 렌더 안 함).
 */
export function resolveHref(url: string): string {
  const v = url.trim()
  if (!v) return v
  // http://·https://·ftp:// 등 '스킴://' authority 형태 → 그대로
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(v)) return v
  // mailto:·tel: 등 점 없는 스킴 → 그대로 (naver.com:8080은 여기 안 걸림)
  if (/^[a-z][a-z\d+-]*:/i.test(v)) return v
  return `https://${v}`
}

/**
 * 참고 링크 입력 검증용. 스킴 보정 후 URL로 해석되면 유효.
 * 빈 값은 유효(선택 항목)로 본다.
 */
export function isValidReferenceUrl(url: string): boolean {
  if (!url || !url.trim()) return true
  try {
    new URL(resolveHref(url))
    return true
  } catch {
    return false
  }
}
