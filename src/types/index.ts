/**
 * 네이밍 용어 매핑 (코드 식별자 ↔ 사용자 노출 라벨)
 * - `place`/`Place` 관련 식별자(테이블 `places`, 라우트 `/places/*`, `/api/places/*`, 타입 `Place`/`PlaceCategory` 등)는
 *   사용자에게는 "다이닝"으로 노출됨(PR #80).
 * - `activity`/`Activity` 관련 식별자는 사용자에게는 "액티비티"로 노출됨(PR #80).
 * - 리네임하지 않은 이유: DB 스키마/URL 브레이킹 리스크. 필요 시 향후 멀티테넌시 재설계와 함께 검토.
 */
export type DurationBucket = 'half' | 'full' | 'overnight'
export type TimeOfDay = 'day' | 'night' | 'any'
export type MealTime = 'lunch' | 'dinner'
export type Status = 'wishlist' | 'visited' | 'archived'
export type LocationType = 'indoor' | 'outdoor'

export interface ActivityCategory {
  id: string
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  is_default: boolean
  is_hidden: boolean
  created_at: string
}

export interface PlaceCategory {
  id: string
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  is_default: boolean
  is_hidden: boolean
  created_at: string
}

export interface Activity {
  id: string
  title: string
  category_id: string | null
  duration_bucket: DurationBucket | null
  time_of_day: TimeOfDay
  location_type: LocationType
  location: string | null
  memo: string | null
  reference_url: string | null
  image_urls: string[]
  status: Status
  visited_at: string | null
  /** 방문 종료일(기간 방문). NULL이면 단일 날짜 방문(visited_at만). activities 전용. */
  visited_end_at: string | null
  rating: number | null
  review_note: string | null
  created_at: string
  updated_at: string
  category?: ActivityCategory | null
}

export interface Place {
  id: string
  title: string
  category_id: string | null
  area: string
  location: string | null
  meal_times: MealTime[]
  memo: string | null
  reference_url: string | null
  image_urls: string[]
  status: Status
  visited_at: string | null
  rating: number | null
  review_note: string | null
  created_at: string
  updated_at: string
  category?: PlaceCategory | null
}
