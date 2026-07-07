'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useDeleteActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      fetchJson(`/api/activities/${id}`, { method: 'DELETE' }),
    // 낙관적 제거: 재조회 왕복을 기다리지 않고 리스트 캐시에서 즉시 항목을 뺀다.
    onMutate: async (id: string) => {
      // 진행 중 재조회가 낙관적 상태를 덮어쓰지 않도록 취소
      await qc.cancelQueries({ queryKey: ['activities'] })
      // 롤백용 스냅샷: ['activities', filters] 모든 필터 변형 캐시
      const prev = qc.getQueriesData<Activity[]>({ queryKey: ['activities'] })
      // 모든 변형에서 해당 항목 즉시 제거(복수형 setQueriesData)
      qc.setQueriesData<Activity[]>({ queryKey: ['activities'] }, (old) =>
        old?.filter((a) => a.id !== id)
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      // 실패 시 스냅샷 복원(카드가 다시 나타남) + 에러 토스트
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error('삭제 중 오류가 발생했습니다.')
    },
    onSuccess: () => {
      toast.success('삭제했어요')
    },
    // 성공/실패 모두 서버 상태와 최종 정합
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
