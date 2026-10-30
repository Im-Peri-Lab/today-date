'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'
import { fetchJson } from './fetcher'

export interface DashboardStats {
  wishlistActivities: number
  wishlistPlaces: number
  visitedActivities: number
  visitedPlaces: number
  wishlistActivityTitles: string[]
  wishlistPlaceTitles: string[]
  visitedActivityTitles: string[]
  visitedPlaceTitles: string[]
}

export function useDashboardStats(initialData?: DashboardStats) {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => fetchJson<DashboardStats>('/api/dashboard/stats'),
    staleTime: 30_000,
    initialData,
  })
}

/**
 * 항목 등록·수정·삭제·상태 되돌리기 뒤에 홈 통계(건수·미리보기)를 최신으로 맞춘다.
 * 홈은 staleTime 30초 캐시를 쓰므로 무효화하지 않으면 홈으로 돌아와도 이전 값이 남는다.
 * 홈이 미마운트(상세/폼에 있는 중)여도 백그라운드 재조회되도록 refetchType: 'all'.
 */
export function invalidateDashboardStats(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: ['dashboard-stats'], refetchType: 'all' })
}
