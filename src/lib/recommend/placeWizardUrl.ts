import type { MealTime } from '@/types'
import { parseCategoryIdsParam } from './wizardUrl'

export type PlaceWizardStep = 1 | 2 | 3 | 'result'

export interface PlaceWizardUrlState {
  step: PlaceWizardStep
  meal: MealTime | null
  area: string
  categoryIds: string[]
}

export function parseMealParam(v: string | null): MealTime | null {
  return v === 'lunch' || v === 'dinner' ? v : null
}

export function readPlaceWizardUrlState(search: string): PlaceWizardUrlState {
  const params = new URLSearchParams(search)
  const stepParam = params.get('step')
  const step: PlaceWizardStep =
    stepParam === 'result' ? 'result' : stepParam === '2' || stepParam === '3' ? (Number(stepParam) as 2 | 3) : 1
  return {
    step,
    meal: parseMealParam(params.get('meal')),
    area: params.get('area') ?? '',
    categoryIds: parseCategoryIdsParam(params.get('cats')),
  }
}

export function buildPlaceWizardQuery(s: PlaceWizardUrlState): string {
  const params = new URLSearchParams()
  params.set('step', String(s.step))
  if (s.meal) params.set('meal', s.meal)
  if (s.area) params.set('area', s.area)
  if (s.categoryIds.length > 0) params.set('cats', s.categoryIds.join(','))
  return params.toString()
}

// 결과 캐시(resultCache.ts) 무효화 키 — 선택 조건만으로 구성(step은 항상 고정값이라 무관).
export function placeConditionsKey(s: Pick<PlaceWizardUrlState, 'meal' | 'area' | 'categoryIds'>): string {
  return buildPlaceWizardQuery({ step: 'result', ...s })
}
