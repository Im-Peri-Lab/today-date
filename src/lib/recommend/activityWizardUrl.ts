import type { DurationBucket, TimeOfDay, LocationType } from '@/types'
import { parseCategoryIdsParam } from './wizardUrl'

export type ActivityWizardStep = 1 | 2 | 3 | 4 | 'result'

export interface ActivityWizardUrlState {
  step: ActivityWizardStep
  duration: DurationBucket | null
  timeOfDay: TimeOfDay | null
  locationType: LocationType | null
  categoryIds: string[]
}

export function parseDurationParam(v: string | null): DurationBucket | null {
  return v === 'half' || v === 'full' || v === 'overnight' ? v : null
}
export function parseTimeOfDayParam(v: string | null): TimeOfDay | null {
  return v === 'day' || v === 'night' || v === 'any' ? v : null
}
export function parseLocationTypeParam(v: string | null): LocationType | null {
  return v === 'indoor' || v === 'outdoor' ? v : null
}

export function readActivityWizardUrlState(search: string): ActivityWizardUrlState {
  const params = new URLSearchParams(search)
  const stepParam = params.get('step')
  const step: ActivityWizardStep =
    stepParam === 'result'
      ? 'result'
      : stepParam === '2' || stepParam === '3' || stepParam === '4'
        ? (Number(stepParam) as 2 | 3 | 4)
        : 1
  return {
    step,
    duration: parseDurationParam(params.get('duration')),
    timeOfDay: parseTimeOfDayParam(params.get('time')),
    locationType: parseLocationTypeParam(params.get('loc')),
    categoryIds: parseCategoryIdsParam(params.get('cats')),
  }
}

export function buildActivityWizardQuery(s: ActivityWizardUrlState): string {
  const params = new URLSearchParams()
  params.set('step', String(s.step))
  if (s.duration) params.set('duration', s.duration)
  if (s.timeOfDay) params.set('time', s.timeOfDay)
  if (s.locationType) params.set('loc', s.locationType)
  if (s.categoryIds.length > 0) params.set('cats', s.categoryIds.join(','))
  return params.toString()
}

// 결과 캐시(resultCache.ts) 무효화 키 — 선택 조건만으로 구성(step은 항상 고정값이라 무관).
// includeShorter는 조건이 아니라 같은 조건 안에서의 표시 옵션이라 키에 넣지 않는다(별도 저장).
export function activityConditionsKey(
  s: Pick<ActivityWizardUrlState, 'duration' | 'timeOfDay' | 'locationType' | 'categoryIds'>
): string {
  return buildActivityWizardQuery({ step: 'result', ...s })
}
