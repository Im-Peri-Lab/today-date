'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Place, Status } from '@/types'
import { fetchJson } from './fetcher'

export interface PlaceFilters {
  status: Status
  categoryIds?: string[]
  location?: string
  meal_time?: string
  q?: string
}

function buildPlaceParams(filters: PlaceFilters) {
  const params = new URLSearchParams()
  params.set('status', filters.status)
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    params.set('category_id', filters.categoryIds.join(','))
  }
  if (filters.location) params.set('location', filters.location)
  if (filters.meal_time) params.set('meal_time', filters.meal_time)
  if (filters.q) params.set('q', filters.q)
  return params.toString()
}

export function usePlaces(filters: PlaceFilters, enabled = true) {
  return useQuery({
    queryKey: ['places', filters],
    queryFn: async () =>
      (await fetchJson<{ data: Place[] }>(`/api/places?${buildPlaceParams(filters)}`)).data,
    enabled,
  })
}

export function usePlace(id: string | undefined, initialData?: Place) {
  return useQuery({
    queryKey: ['place', id],
    queryFn: async () => (await fetchJson<{ data: Place }>(`/api/places/${id}`)).data,
    enabled: !!id,
    initialData,
  })
}

export function useUpdatePlace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Place> }) =>
      (
        await fetchJson<{ data: Place }>(`/api/places/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
      ).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['places'] })
      if (data?.id) qc.invalidateQueries({ queryKey: ['place', data.id] })
    },
  })
}

export function useDeletePlace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => fetchJson(`/api/places/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['places'] })
    },
  })
}
