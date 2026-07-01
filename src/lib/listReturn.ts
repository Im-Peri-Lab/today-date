import type { Status } from '@/types'

export type ListTab = 'activity' | 'place'
export type ListStatus = Extract<Status, 'wishlist' | 'visited'>
export type DetailEditTarget = 'info' | 'visit'

export const DEFAULT_LIST_RETURN_TO = '/list'

export function isListTab(value: string | null): value is ListTab {
  return value === 'activity' || value === 'place'
}

export function isListStatus(value: string | null): value is ListStatus {
  return value === 'wishlist' || value === 'visited'
}

export function buildListReturnTo(
  search: string | URLSearchParams | null | undefined,
  tab: ListTab,
  status: ListStatus
) {
  const params = new URLSearchParams(normalizeSearch(search))
  params.set('tab', tab)
  params.set('status', status)

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

function normalizeSearch(search: string | URLSearchParams | null | undefined) {
  if (!search) return ''
  if (typeof search !== 'string') return search.toString()
  return search.startsWith('?') ? search.slice(1) : search
}
