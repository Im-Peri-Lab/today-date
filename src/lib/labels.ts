import type { DurationBucket, TimeOfDay, MealTime, Status } from '@/types'

export const STATUS_LABELS: Record<Status, string> = {
  wishlist: '가보고 싶은 곳',
  visited: '다녀온 곳',
  archived: '보관됨',
}

export const DURATION_LABELS: Record<DurationBucket, string> = {
  half: '반나절',
  full: '하루',
  overnight: '1박 이상',
}

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  day: '주간',
  night: '야간',
  any: '상관없음',
}

export const MEAL_LABELS: Record<MealTime, string> = {
  lunch: '점심',
  dinner: '저녁',
}

export const DURATION_OPTIONS = [
  { value: 'half', label: DURATION_LABELS.half },
  { value: 'full', label: DURATION_LABELS.full },
  { value: 'overnight', label: DURATION_LABELS.overnight },
] as const

export const TIME_OPTIONS = [
  { value: 'day', label: TIME_OF_DAY_LABELS.day },
  { value: 'night', label: TIME_OF_DAY_LABELS.night },
  { value: 'any', label: TIME_OF_DAY_LABELS.any },
] as const

export const MEAL_OPTIONS = [
  { value: 'lunch', label: MEAL_LABELS.lunch },
  { value: 'dinner', label: MEAL_LABELS.dinner },
] as const
