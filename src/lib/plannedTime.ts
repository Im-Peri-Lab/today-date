import type { MealTime } from '@/types'

/**
 * "+ 시간 추가"를 탭했을 때 시간 필드에 미리 채울 값(021).
 * 다이닝만: 저녁이 포함되면 18:30, 점심만 있으면 12:00. 식사 시간 정보가 없거나 액티비티면 빈 값.
 * 미리 채운 값은 사용자가 저장하기를 눌러야 저장된다(그대로 저장하면 그 값이 들어가는 건 의도).
 */
export function defaultPlannedTime(
  track: 'activity' | 'place',
  mealTimes?: MealTime[] | null,
): string {
  if (track !== 'place' || !mealTimes || mealTimes.length === 0) return ''
  if (mealTimes.includes('dinner')) return '18:30'
  return mealTimes.includes('lunch') ? '12:00' : ''
}
