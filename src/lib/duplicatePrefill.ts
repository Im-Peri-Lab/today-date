import type { ActivityFormValues } from '@/lib/schemas/activitySchema'
import type { PlaceFormValues } from '@/lib/schemas/placeSchema'
import type { Activity, Place } from '@/types'

/**
 * "복사하기" 임시 저장소 (sessionStorage).
 *
 * 복사하기 클릭 시 원본의 "등록 정보"만 stash 하고 신규 추가 화면으로 이동한다.
 * 신규 폼은 마운트 시 값을 take(읽기 후 즉시 삭제)해 prefill 한다.
 * - DB에는 아무것도 만들지 않는다 (저장 버튼을 눌러야 생성).
 * - 방문 기록성 데이터(status/visited_at/rating/review/생성일/id)는 stash 대상에 없다.
 * - one-shot(read+remove)이라 새로고침·뒤로가기에서 stale prefill 이 남지 않는다.
 * - 메모/링크/위치를 URL 에 노출하지 않으려고 query string 직렬화 대신 sessionStorage 를 쓴다.
 */

/**
 * 원본이 duration_bucket 없이 저장돼 있을 수 있어 prefill 에서는 optional 로 둔다
 * (신규 폼은 필수 검증을 그대로 유지 — 저장 시 사용자가 선택).
 */
export type ActivityPrefill = Omit<ActivityFormValues, 'duration_bucket'> & {
  duration_bucket?: ActivityFormValues['duration_bucket']
}

const ACTIVITY_KEY = 'today-date:duplicate:activity'
const PLACE_KEY = 'today-date:duplicate:place'

/** 복사본 제목: `{원본} 복사본`, 단 create schema 의 max(100) 을 넘지 않게 원본만 잘라낸다. */
const COPY_SUFFIX = ' 복사본'
const TITLE_MAX = 100

export function buildCopyTitle(original: string): string {
  const full = `${original}${COPY_SUFFIX}`
  if (full.length <= TITLE_MAX) return full
  return `${original.slice(0, TITLE_MAX - COPY_SUFFIX.length)}${COPY_SUFFIX}`
}

function stash(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* sessionStorage 차단(프라이빗 모드 등) 환경은 무시 */
  }
}

function take<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    if (raw == null) return null
    sessionStorage.removeItem(key)
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function stashActivityPrefill(values: ActivityPrefill) {
  stash(ACTIVITY_KEY, values)
}

export function takeActivityPrefill(): ActivityPrefill | null {
  return take<ActivityPrefill>(ACTIVITY_KEY)
}

export function stashPlacePrefill(values: PlaceFormValues) {
  stash(PLACE_KEY, values)
}

export function takePlacePrefill(): PlaceFormValues | null {
  return take<PlaceFormValues>(PLACE_KEY)
}

/**
 * 원본 활동 → 등록 정보만 stash 하고 신규 활동 폼 경로를 돌려준다 (상세·리스트 카드 공용).
 * 방문 기록성 데이터(status/visited_at/rating/review_note)·생성일·id 는 복사하지 않는다 → 저장 시 wishlist.
 */
export function stashActivityDuplicate(activity: Activity): string {
  stashActivityPrefill({
    title: buildCopyTitle(activity.title),
    category_id: activity.category_id ?? '',
    duration_bucket: activity.duration_bucket ?? undefined,
    time_of_day: activity.time_of_day,
    location: activity.location ?? '',
    memo: activity.memo ?? '',
    reference_url: activity.reference_url ?? '',
  })
  return '/activities/new?from=copy'
}

/**
 * 원본 장소 → 등록 정보만 stash 하고 신규 장소 폼 경로를 돌려준다 (상세·리스트 카드 공용).
 * area(지역)·location(위치)를 그대로 분리 보존한다.
 */
export function stashPlaceDuplicate(place: Place): string {
  stashPlacePrefill({
    title: buildCopyTitle(place.title),
    category_id: place.category_id ?? '',
    area: place.area,
    location: place.location ?? '',
    meal_times: place.meal_times,
    memo: place.memo ?? '',
    reference_url: place.reference_url ?? '',
  })
  return '/places/new?from=copy'
}
