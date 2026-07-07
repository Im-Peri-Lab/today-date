'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Place, Status } from '@/types'
import { fetchJson } from './fetcher'

export interface PlaceFilters {
  status: Status
  categoryIds?: string[]
  area?: string
  meal_time?: string
  q?: string
}

function buildPlaceParams(filters: PlaceFilters) {
  const params = new URLSearchParams()
  params.set('status', filters.status)
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    params.set('category_id', filters.categoryIds.join(','))
  }
  if (filters.area) params.set('area', filters.area)
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
      // PATCH 응답(조인 포함 전체 레코드, GET과 동일 shape)을 상세 캐시에 즉시 반영해
      // 재조회 왕복 없이 저장 후 값이 첫 렌더부터 보이도록 한다(stale-then-fresh 깜빡임 제거).
      if (data?.id) qc.setQueryData(['place', data.id], data)
      // 리스트는 정렬/필터가 바뀔 수 있으므로 무효화 유지.
      // 미마운트 상태(사용자가 상세/폼에 있을 때)에서도 즉시 백그라운드 재조회되도록
      // refetchType: 'all'. /list 복귀 시 stale 프레임 없이 최신 목록이 보인다.
      qc.invalidateQueries({ queryKey: ['places'], refetchType: 'all' })
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
