'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJson } from './fetcher'

export interface DashboardStats {
  totalActivities: number
  totalPlaces: number
  totalVisited: number
  visitedThisMonth: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => fetchJson<DashboardStats>('/api/dashboard/stats'),
    staleTime: 30_000,
  })
}
