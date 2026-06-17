'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJson } from './fetcher'

export interface DashboardStats {
  wishlistActivities: number
  wishlistPlaces: number
  visitedActivities: number
  visitedPlaces: number
}

export function useDashboardStats(initialData?: DashboardStats) {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => fetchJson<DashboardStats>('/api/dashboard/stats'),
    staleTime: 30_000,
    initialData,
  })
}
