'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Activity, Status } from '@/types'
import { fetchJson } from './fetcher'

export interface ActivityFilters {
  status: Status
  categoryIds?: string[]
  duration_bucket?: string
  time_of_day?: string
  q?: string
}

function buildActivityParams(filters: ActivityFilters) {
  const params = new URLSearchParams()
  params.set('status', filters.status)
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    params.set('category_id', filters.categoryIds.join(','))
  }
  if (filters.duration_bucket) params.set('duration_bucket', filters.duration_bucket)
  if (filters.time_of_day) params.set('time_of_day', filters.time_of_day)
  if (filters.q) params.set('q', filters.q)
  return params.toString()
}

export function useActivities(filters: ActivityFilters, enabled = true) {
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: async () =>
      (await fetchJson<{ data: Activity[] }>(`/api/activities?${buildActivityParams(filters)}`))
        .data,
    enabled,
  })
}

export function useActivity(id: string | undefined, initialData?: Activity) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: async () =>
      (await fetchJson<{ data: Activity }>(`/api/activities/${id}`)).data,
    enabled: !!id,
    initialData,
  })
}

export function useUpdateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Activity> }) =>
      (
        await fetchJson<{ data: Activity }>(`/api/activities/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
      ).data,
    onSuccess: (data) => {
      // PATCH 응답(조인 포함 전체 레코드, GET과 동일 shape)을 상세 캐시에 즉시 반영해
      // 재조회 왕복 없이 저장 후 값이 첫 렌더부터 보이도록 한다(stale-then-fresh 깜빡임 제거).
      if (data?.id) qc.setQueryData(['activity', data.id], data)
      // 리스트는 정렬/필터가 바뀔 수 있으므로 무효화 유지.
      // 미마운트 상태(사용자가 상세/폼에 있을 때)에서도 즉시 백그라운드 재조회되도록
      // refetchType: 'all'. /list 복귀 시 stale 프레임 없이 최신 목록이 보인다.
      qc.invalidateQueries({ queryKey: ['activities'], refetchType: 'all' })
    },
  })
}

export function useDeleteActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      fetchJson(`/api/activities/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
