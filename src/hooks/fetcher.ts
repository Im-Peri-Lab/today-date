export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error ?? '요청 처리 중 오류가 발생했습니다.')
  }
  return json as T
}
