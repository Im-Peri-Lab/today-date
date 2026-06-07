import { Sun, Moon, type LucideIcon } from 'lucide-react'
import type { DurationBucket, TimeOfDay, MealTime, Status } from '@/types'

export const STATUS_LABELS: Record<Status, string> = {
  wishlist: '가보고 싶은 곳',
  visited: '다녀온 곳',
  archived: '보관됨',
}

/**
 * 카드 메뉴(ItemMenu) 전용 상태 전환 라벨 — 메뉴 폭을 아끼는 단축형.
 * key = 전환 '목적지' 상태. 상세 화면 하단 Primary 버튼의 풀 라벨
 * ("가보고 싶은 곳으로 되돌리기")과는 분리해서 관리한다.
 */
export const STATUS_MENU_LABELS: Record<Status, string> = {
  wishlist: '가보고 싶은 곳으로',
  visited: '다녀온 곳으로',
  archived: '보관함으로',
}

export const DURATION_LABELS: Record<DurationBucket, string> = {
  half: '반나절',
  full: '하루',
  overnight: '1박 이상',
}

/** duration 위계(짧음 0 → 김 2). "더 짧은 일정 포함" 비교용. */
export const DURATION_RANK: Record<DurationBucket, number> = {
  half: 0,
  full: 1,
  overnight: 2,
}

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  day: '주간',
  night: '야간',
  any: '아무때나',
}

/** 시간대 → lucide 아이콘 (카드·상세 공용). day=Sun / night=Moon / any=아이콘 없음(라벨만) */
export const TIME_OF_DAY_ICONS: Record<TimeOfDay, LucideIcon | null> = {
  day: Sun,
  night: Moon,
  any: null,
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
