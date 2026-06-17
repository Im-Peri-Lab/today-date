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
      qc.invalidateQueries({ queryKey: ['activities'] })
      if (data?.id) qc.invalidateQueries({ queryKey: ['activity', data.id] })
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
