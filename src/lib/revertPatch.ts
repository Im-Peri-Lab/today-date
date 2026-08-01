import type { Activity, Place } from '@/types'

/** 되돌리기: 방문 기록(별점·감상·방문일)을 모두 지우고 위시리스트로 되돌린다. */
export const ACTIVITY_REVERT_PATCH: Partial<Activity> = {
  status: 'wishlist',
  visited_at: null,
  visited_end_at: null,
  rating: null,
  review_note: null,
}

export const PLACE_REVERT_PATCH: Partial<Place> = {
  status: 'wishlist',
  visited_at: null,
  rating: null,
  review_note: null,
}
