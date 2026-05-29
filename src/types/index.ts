export type DurationBucket = 'half' | 'full' | 'overnight'
export type TimeOfDay = 'day' | 'night' | 'any'
export type MealTime = 'lunch' | 'dinner'
export type Status = 'wishlist' | 'visited' | 'archived'

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
  memo: string | null
  reference_url: string | null
  image_urls: string[]
  added_by: string | null
  status: Status
  visited_at: string | null
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
  location: string
  meal_times: MealTime[]
  memo: string | null
  reference_url: string | null
  image_urls: string[]
  added_by: string | null
  status: Status
  visited_at: string | null
  rating: number | null
  review_note: string | null
  created_at: string
  updated_at: string
  category?: PlaceCategory | null
}
