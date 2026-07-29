import type { Page } from '@playwright/test'

const now = new Date().toISOString()

export const ACTIVITY_CATEGORY_FIXTURE = {
  id: 'cat-act-1',
  name: '실내데이트',
  icon: null,
  color: null,
  sort_order: 0,
  is_default: true,
  is_hidden: false,
  created_at: now,
}

export const PLACE_CATEGORY_FIXTURE = {
  id: 'cat-place-1',
  name: '한식',
  icon: null,
  color: null,
  sort_order: 0,
  is_default: true,
  is_hidden: false,
  created_at: now,
}

export function activityFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'activity-1',
    title: '한강 자전거',
    category_id: null,
    duration_bucket: 'half',
    time_of_day: 'day',
    location_type: 'outdoor',
    location: null,
    memo: null,
    reference_url: null,
    image_urls: [],
    status: 'wishlist',
    visited_at: null,
    visited_end_at: null,
    rating: null,
    review_note: null,
    created_at: now,
    updated_at: now,
    category: null,
    ...overrides,
  }
}

export const PLACE_TITLE = '망원동 파스타집'

export function placeFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'place-1',
    title: PLACE_TITLE,
    category_id: null,
    area: '망원동',
    location: null,
    meal_times: ['lunch', 'dinner'],
    memo: null,
    reference_url: null,
    image_urls: [],
    status: 'wishlist',
    visited_at: null,
    rating: null,
    review_note: null,
    created_at: now,
    updated_at: now,
    category: null,
    ...overrides,
  }
}

/** 활동 위저드 E2E — 카테고리 목록만 필요(결과 화면까지 가지 않음). */
export async function mockActivityCategories(page: Page) {
  await page.route('**/api/activity-categories', (route) =>
    route.fulfill({ json: { data: [ACTIVITY_CATEGORY_FIXTURE] } })
  )
}

/**
 * 다이닝 위저드 E2E — 카테고리 + 추천 결과. recommend 응답에 호출 횟수를 심어서, 결과 화면
 * 재진입 시 실제로 재조회 없이 sessionStorage 캐시가 쓰였는지(같은 call 번호인지)를
 * 테스트에서 구분할 수 있게 한다.
 */
export function mockPlaceRecommend(page: Page) {
  let callCount = 0
  return page.route('**/api/recommend/place', (route) => {
    callCount += 1
    route.fulfill({
      json: {
        recommendations: [placeFixture({ title: `${PLACE_TITLE} (call ${callCount})` })],
        reason: '점심에 가기 좋은 다이닝이에요 💜',
        poolSize: 5,
        log_id: `log-place-${callCount}`,
      },
    })
  })
}

export async function mockPlaceCategories(page: Page) {
  await page.route('**/api/place-categories', (route) =>
    route.fulfill({ json: { data: [PLACE_CATEGORY_FIXTURE] } })
  )
}
