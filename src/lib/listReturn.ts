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
  meal_time?: string
}

export const DEFAULT_LIST_RETURN_TO = '/list'

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
    if (url.origin !== base.origin || url.pathname !== DEFAULT_LIST_RETURN_TO) {
      return undefined
    }

    return `${url.pathname}${url.search}`
  } catch {
    return undefined
  }
}
