import type { Status } from '@/types'

export type ListTab = 'activity' | 'place'
export type ListStatus = Extract<Status, 'wishlist' | 'visited'>
export type DetailEditTarget = 'info' | 'visit'

export interface ListUrlState {
  tab: ListTab
  status: ListStatus
  q?: string
  categoryIds?: string[]
  duration_bucket?: string
  time_of_day?: string
  location_type?: string
  meal_time?: string
}

export const DEFAULT_LIST_RETURN_TO = '/list'

// 추천위저드 결과 화면 경로 — getSafeListReturnTo 화이트리스트와 isRecommendReturnTo 판별이
// 공유하는 단일 출처. 새 위저드 경로가 추가되면 여기에만 더한다.
export const RECOMMEND_RETURN_PATHS = ['/recommend/activity', '/recommend/place'] as const

export function isListTab(value: string | null): value is ListTab {
  return value === 'activity' || value === 'place'
}

export function isListStatus(value: string | null): value is ListStatus {
  return value === 'wishlist' || value === 'visited'
}

export function buildListReturnTo(state: ListUrlState) {
  const params = new URLSearchParams()
  params.set('tab', state.tab)
  params.set('status', state.status)
  if (state.q) params.set('q', state.q)
  if (state.categoryIds && state.categoryIds.length > 0) {
    params.set('category_id', state.categoryIds.join(','))
  }

  if (state.tab === 'activity') {
    if (state.duration_bucket) params.set('duration_bucket', state.duration_bucket)
    if (state.time_of_day) params.set('time_of_day', state.time_of_day)
    if (state.location_type) params.set('location_type', state.location_type)
  } else if (state.meal_time) {
    params.set('meal_time', state.meal_time)
  }

  const query = params.toString()
  return query ? `${DEFAULT_LIST_RETURN_TO}?${query}` : DEFAULT_LIST_RETURN_TO
}

export function buildDetailHref(
  pathname: string,
  options: { edit?: DetailEditTarget; returnTo?: string } = {}
) {
  const params = new URLSearchParams()
  if (options.edit) params.set('edit', options.edit)
  if (options.returnTo) params.set('returnTo', options.returnTo)

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function getSafeListReturnTo(value: string | string[] | null | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !raw.startsWith('/')) return undefined

  try {
    const base = new URL('https://today-date.local')
    const url = new URL(raw, base)
    // 오픈 리다이렉트 방지: 오리진이 같고, 경로가 허용 목록(목록 화면 + 추천위저드 결과 화면)
    // 중 하나일 때만 통과시킨다. 새 반환 대상 화면을 추가할 땐 이 배열만 늘린다.
    const isAllowedPath =
      url.pathname === DEFAULT_LIST_RETURN_TO ||
      (RECOMMEND_RETURN_PATHS as readonly string[]).includes(url.pathname)
    if (url.origin !== base.origin || !isAllowedPath) {
      return undefined
    }

    return `${url.pathname}${url.search}`
  } catch {
    return undefined
  }
}

/** returnTo가 목록이 아니라 추천위저드 결과 화면을 가리키는지 — 상세 화면의 복귀 버튼 라벨 분기에 사용. */
export function isRecommendReturnTo(value: string | undefined): boolean {
  if (!value) return false
  return (RECOMMEND_RETURN_PATHS as readonly string[]).some(
    (p) => value === p || value.startsWith(`${p}?`)
  )
}
