'use client'

import { useMutation } from '@tanstack/react-query'
import type { Activity, Place } from '@/types'
import type { ActivityRecommendInput } from '@/lib/recommend/activity'
import type { PlaceRecommendInput } from '@/lib/recommend/place'
import { fetchJson } from './fetcher'

export interface ActivityRecommendResponse {
  recommendations: Activity[]
  reason: string
  /** 필터 통과 후보 풀 크기. poolSize > 3 일 때만 "다른 추천 보기"가 의미 있음. */
  poolSize: number
  log_id: string | null
}

export interface PlaceRecommendResponse {
  recommendations: Place[]
  reason: string
  /** 필터 통과 후보 풀 크기. poolSize > 3 일 때만 "다른 추천 보기"가 의미 있음. */
  poolSize: number
  log_id: string | null
}

export function useRecommendActivity() {
  return useMutation({
    mutationFn: async (input: ActivityRecommendInput) =>
      fetchJson<ActivityRecommendResponse>('/api/recommend/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
  })
}

export function useRecommendPlace() {
  return useMutation({
    mutationFn: async (input: PlaceRecommendInput) =>
      fetchJson<PlaceRecommendResponse>('/api/recommend/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
  })
}

export function useSelectRecommendation() {
  return useMutation({
    mutationFn: async ({ log_id, selected_id }: { log_id: string; selected_id: string }) =>
      fetchJson('/api/recommend/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id, selected_id }),
      }),
  })
}
