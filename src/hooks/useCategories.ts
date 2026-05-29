'use client'

import { useQuery } from '@tanstack/react-query'
import type { ActivityCategory, PlaceCategory } from '@/types'
import { fetchJson } from './fetcher'

const CATEGORY_STALE = 5 * 60_000

export function useActivityCategories() {
  return useQuery({
    queryKey: ['activity-categories'],
    queryFn: async () =>
      (await fetchJson<{ data: ActivityCategory[] }>('/api/activity-categories')).data,
    staleTime: CATEGORY_STALE,
  })
}

export function usePlaceCategories() {
  return useQuery({
    queryKey: ['place-categories'],
    queryFn: async () =>
      (await fetchJson<{ data: PlaceCategory[] }>('/api/place-categories')).data,
    staleTime: CATEGORY_STALE,
  })
}

export function useCategories(track: 'activity' | 'place') {
  const activity = useActivityCategories()
  const place = usePlaceCategories()
  return track === 'activity' ? activity : place
}
