import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createFakeSupabase, type FakeDb, type FakeRow } from './fakeSupabase'

/**
 * 도메인 데이터(activities / places / recommendations_log) 커플 격리 검증.
 *
 * 프로덕션에는 커플이 1개뿐이라 실제 침범 테스트를 할 수 없다. 그래서 인메모리
 * 대역(fakeSupabase)에 가상의 커플 B 행을 심고, 커플 A 의 세션으로 라우트
 * 핸들러를 그대로 실행해 응답과 DB 최종 상태를 함께 확인한다.
 *
 * 응답만 보면 부족하다 — UPDATE/DELETE 는 남의 행을 건드려도 0건 처리로 200 이
 * 나갈 수 있고, 반대로 404 를 주면서 실제로는 행을 지웠을 수도 있다. 그래서
 * 모든 쓰기 테스트는 커플 B 의 행이 그대로인지도 함께 본다.
 */

const COUPLE_A = '11111111-1111-4111-8111-111111111111'
const COUPLE_B = '22222222-2222-4222-8222-222222222222'
const LOG_A = '33333333-3333-4333-8333-333333333333'
const LOG_B = '44444444-4444-4444-8444-444444444444'
const SELECTED_ID = '55555555-5555-4555-8555-555555555555'
const ACT_CAT = '66666666-6666-4666-8666-666666666666'
const PLC_CAT = '77777777-7777-4777-8777-777777777777'

let db: FakeDb
let session: { authenticated: boolean; couple_id?: string }

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => createFakeSupabase(db),
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => session,
}))

import { GET as listActivities, POST as createActivity } from '@/app/api/activities/route'
import {
  GET as getActivity,
  PATCH as patchActivity,
  DELETE as deleteActivity,
} from '@/app/api/activities/[id]/route'
import { GET as listPlaces, POST as createPlace } from '@/app/api/places/route'
import {
  GET as getPlace,
  PATCH as patchPlace,
  DELETE as deletePlace,
} from '@/app/api/places/[id]/route'
import { POST as recommendActivity } from '@/app/api/recommend/activity/route'
import { POST as recommendPlace } from '@/app/api/recommend/place/route'
import { POST as selectRecommendation } from '@/app/api/recommend/select/route'
import { GET as dashboardStats } from '@/app/api/dashboard/stats/route'

/** 커플 A/B 가 각각 액티비티·다이닝·추천로그를 가진 상태. */
function seed(): FakeDb {
  return {
    activity_categories: [{ id: ACT_CAT, name: '미분류', icon: 'x', color: '#fff' }],
    place_categories: [{ id: PLC_CAT, name: '미분류', icon: 'x', color: '#fff' }],
    activities: [
      {
        id: 'act-a-wish', couple_id: COUPLE_A, title: 'A의 한강 산책', status: 'wishlist',
        category_id: ACT_CAT, location_type: 'outdoor', duration_bucket: 'half',
        time_of_day: 'any', memo: null, created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'act-a-visited', couple_id: COUPLE_A, title: 'A의 전시회', status: 'visited',
        category_id: ACT_CAT, location_type: 'indoor', duration_bucket: 'half',
        time_of_day: 'any', memo: null, visited_at: '2026-02-01',
        created_at: '2026-01-02T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
      },
      {
        id: 'act-b-wish', couple_id: COUPLE_B, title: 'B의 비밀 캠핑', status: 'wishlist',
        category_id: ACT_CAT, location_type: 'outdoor', duration_bucket: 'half',
        time_of_day: 'any', memo: 'B의 비밀 메모', created_at: '2026-01-03T00:00:00Z',
      },
    ],
    places: [
      {
        id: 'plc-a-wish', couple_id: COUPLE_A, title: 'A의 파스타집', status: 'wishlist',
        area: '연남동', meal_times: ['lunch', 'dinner'], category_id: PLC_CAT,
        memo: null, created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'plc-b-wish', couple_id: COUPLE_B, title: 'B의 비밀 스시집', status: 'wishlist',
        area: '청담동', meal_times: ['dinner'], category_id: PLC_CAT,
        memo: 'B의 비밀 메모', created_at: '2026-01-02T00:00:00Z',
      },
    ],
    recommendations_log: [
      {
        id: LOG_A, couple_id: COUPLE_A, track: 'activity', recommend_type: 'quick',
        input_filters: {}, recommended_ids: ['act-a-wish'], selected_id: null,
        created_at: new Date().toISOString(),
      },
      {
        id: LOG_B, couple_id: COUPLE_B, track: 'activity', recommend_type: 'quick',
        input_filters: {}, recommended_ids: ['act-b-wish'], selected_id: null,
        created_at: new Date().toISOString(),
      },
    ],
  }
}

const asA = () => { session = { authenticated: true, couple_id: COUPLE_A } }
const asB = () => { session = { authenticated: true, couple_id: COUPLE_B } }

const jsonReq = (url: string, method: string, body: unknown) =>
  new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const params = (id: string) => ({ params: Promise.resolve({ id }) })
const rowById = (table: string, id: string) => db[table].find((r) => r.id === id)
const ids = (rows: FakeRow[]): string[] => rows.map((r) => r.id)

beforeEach(() => {
  db = seed()
  asA()
})

// ──────────────────────────────────────────────
// 1. 조회 — 남의 커플 행이 보이지 않는다
// ──────────────────────────────────────────────
describe('격리 · 조회(SELECT)', () => {
  it('GET /api/activities — A 세션 목록에 B 의 행이 없다', async () => {
    const res = await listActivities(new NextRequest('http://localhost/api/activities'))
    const { data } = await res.json()

    expect(res.status).toBe(200)
    expect(ids(data)).toEqual(['act-a-wish'])
  })

  it('GET /api/activities?q= — 검색으로도 B 의 행을 끌어올 수 없다', async () => {
    // B 의 제목/메모에만 있는 단어로 검색한다(or(title.ilike, memo.ilike) 경로).
    const res = await listActivities(new NextRequest('http://localhost/api/activities?q=비밀'))
    const { data } = await res.json()

    expect(data).toEqual([])
  })

  it('GET /api/places — A 세션 목록에 B 의 행이 없다', async () => {
    const res = await listPlaces(new NextRequest('http://localhost/api/places'))
    const { data } = await res.json()

    expect(ids(data)).toEqual(['plc-a-wish'])
  })

  it('GET /api/places?area= — B 지역으로 조회해도 B 의 행이 안 나온다', async () => {
    const res = await listPlaces(new NextRequest('http://localhost/api/places?area=청담동'))
    const { data } = await res.json()

    expect(data).toEqual([])
  })

  it('GET /api/activities/[id] — B 소유 id 는 404 (403 이 아니다)', async () => {
    const res = await getActivity(
      new NextRequest('http://localhost/api/activities/act-b-wish'),
      params('act-b-wish')
    )

    expect(res.status).toBe(404)
  })

  it('GET /api/activities/[id] — 없는 id 와 B 소유 id 의 응답이 구별되지 않는다', async () => {
    const foreign = await getActivity(
      new NextRequest('http://localhost/api/activities/act-b-wish'),
      params('act-b-wish')
    )
    const missing = await getActivity(
      new NextRequest('http://localhost/api/activities/does-not-exist'),
      params('does-not-exist')
    )

    expect(foreign.status).toBe(missing.status)
    expect(await foreign.json()).toEqual(await missing.json())
  })

  it('GET /api/places/[id] — B 소유 id 는 404', async () => {
    const res = await getPlace(
      new NextRequest('http://localhost/api/places/plc-b-wish'),
      params('plc-b-wish')
    )

    expect(res.status).toBe(404)
  })

  it('GET /api/dashboard/stats — 집계에 B 의 행이 섞이지 않는다', async () => {
    const res = await dashboardStats()
    const stats = await res.json()

    expect(stats.wishlistActivities).toBe(1)
    expect(stats.wishlistPlaces).toBe(1)
    expect(stats.wishlistActivityTitles).toEqual(['A의 한강 산책'])
    expect(stats.wishlistPlaceTitles).toEqual(['A의 파스타집'])
  })
})

// ──────────────────────────────────────────────
// 2. 수정/삭제 — 남의 행은 404 로 막히고 실제로 바뀌지 않는다
// ──────────────────────────────────────────────
describe('격리 · 수정/삭제(UPDATE/DELETE)', () => {
  it('PATCH /api/activities/[id] — B 소유 행은 404 이고 값이 그대로다', async () => {
    const res = await patchActivity(
      jsonReq('http://localhost/api/activities/act-b-wish', 'PATCH', { title: '탈취됨' }),
      params('act-b-wish')
    )

    expect(res.status).toBe(404)
    expect(rowById('activities', 'act-b-wish')!.title).toBe('B의 비밀 캠핑')
  })

  it('DELETE /api/activities/[id] — B 소유 행은 404 이고 행이 남아 있다', async () => {
    const res = await deleteActivity(
      new NextRequest('http://localhost/api/activities/act-b-wish', { method: 'DELETE' }),
      params('act-b-wish')
    )

    expect(res.status).toBe(404)
    expect(rowById('activities', 'act-b-wish')).toBeDefined()
  })

  it('PATCH /api/places/[id] — B 소유 행은 404 이고 값이 그대로다', async () => {
    const res = await patchPlace(
      jsonReq('http://localhost/api/places/plc-b-wish', 'PATCH', { title: '탈취됨' }),
      params('plc-b-wish')
    )

    expect(res.status).toBe(404)
    expect(rowById('places', 'plc-b-wish')!.title).toBe('B의 비밀 스시집')
  })

  it('DELETE /api/places/[id] — B 소유 행은 404 이고 행이 남아 있다', async () => {
    const res = await deletePlace(
      new NextRequest('http://localhost/api/places/plc-b-wish', { method: 'DELETE' }),
      params('plc-b-wish')
    )

    expect(res.status).toBe(404)
    expect(rowById('places', 'plc-b-wish')).toBeDefined()
  })

  it('POST /api/recommend/select — B 의 추천 로그는 404 이고 선택이 기록되지 않는다', async () => {
    const res = await selectRecommendation(
      jsonReq('http://localhost/api/recommend/select', 'POST', {
        log_id: LOG_B,
        selected_id: SELECTED_ID,
      })
    )

    expect(res.status).toBe(404)
    expect(rowById('recommendations_log', LOG_B)!.selected_id).toBeNull()
  })

  it('삭제 404 는 "없는 id" 와 "남의 id" 를 구별하지 않는다', async () => {
    const foreign = await deleteActivity(
      new NextRequest('http://localhost/x', { method: 'DELETE' }),
      params('act-b-wish')
    )
    const missing = await deleteActivity(
      new NextRequest('http://localhost/x', { method: 'DELETE' }),
      params('nope')
    )

    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(await foreign.json()).toEqual(await missing.json())
  })
})

// ──────────────────────────────────────────────
// 3. 생성 — 소유자는 세션이 정하고, 남의 목록에 나타나지 않는다
// ──────────────────────────────────────────────
describe('격리 · 생성(INSERT)', () => {
  it('POST /api/activities — 생성 행의 couple_id 는 세션값이다', async () => {
    const res = await createActivity(
      jsonReq('http://localhost/api/activities', 'POST', {
        title: 'A가 만든 것',
        location_type: 'indoor',
        duration_bucket: 'half',
      })
    )
    const { data } = await res.json()

    expect(res.status).toBe(201)
    expect(rowById('activities', data.id)!.couple_id).toBe(COUPLE_A)
  })

  it('POST /api/activities — 클라이언트가 보낸 couple_id 는 무시된다', async () => {
    const res = await createActivity(
      jsonReq('http://localhost/api/activities', 'POST', {
        title: 'B 소유로 심으려는 행',
        location_type: 'indoor',
        duration_bucket: 'half',
        couple_id: COUPLE_B, // 침범 시도
      })
    )
    const { data } = await res.json()

    expect(res.status).toBe(201)
    expect(rowById('activities', data.id)!.couple_id).toBe(COUPLE_A)
  })

  it('POST /api/places — 클라이언트가 보낸 couple_id 는 무시된다', async () => {
    const res = await createPlace(
      jsonReq('http://localhost/api/places', 'POST', {
        title: 'B 소유로 심으려는 다이닝',
        area: '연남동',
        meal_times: ['lunch'],
        couple_id: COUPLE_B, // 침범 시도
      })
    )
    const { data } = await res.json()

    expect(res.status).toBe(201)
    expect(rowById('places', data.id)!.couple_id).toBe(COUPLE_A)
  })

  it('A 가 만든 행은 B 의 목록·상세에 나타나지 않는다', async () => {
    const created = await createActivity(
      jsonReq('http://localhost/api/activities', 'POST', {
        title: 'A만 볼 수 있어야 하는 행',
        location_type: 'indoor',
        duration_bucket: 'half',
      })
    )
    const { data } = await created.json()

    asB()
    const listed = await listActivities(new NextRequest('http://localhost/api/activities'))
    const listedIds = ids((await listed.json()).data)
    const detail = await getActivity(new NextRequest('http://localhost/x'), params(data.id))

    expect(listedIds).not.toContain(data.id)
    expect(listedIds).toEqual(['act-b-wish'])
    expect(detail.status).toBe(404)
  })

  it('POST /api/recommend/activity — 추천 로그가 세션 커플 소유로 기록된다', async () => {
    const res = await recommendActivity(
      jsonReq('http://localhost/api/recommend/activity', 'POST', { duration_bucket: 'half' })
    )
    const { log_id } = await res.json()

    expect(res.status).toBe(200)
    expect(rowById('recommendations_log', log_id)!.couple_id).toBe(COUPLE_A)
  })
})

// ──────────────────────────────────────────────
// 4. 추천 — 후보 풀에 남의 행이 들어오지 않는다
// ──────────────────────────────────────────────
describe('격리 · 추천', () => {
  it('POST /api/recommend/activity — 후보에 B 의 액티비티가 없다', async () => {
    const res = await recommendActivity(
      jsonReq('http://localhost/api/recommend/activity', 'POST', {
        duration_bucket: 'half',
        include_visited: true,
      })
    )
    const { recommendations, poolSize } = await res.json()

    expect(ids(recommendations).sort()).toEqual(['act-a-visited', 'act-a-wish'])
    expect(poolSize).toBe(2)
  })

  it('POST /api/recommend/place — 후보에 B 의 다이닝이 없다', async () => {
    const res = await recommendPlace(
      jsonReq('http://localhost/api/recommend/place', 'POST', { meal_time: 'dinner' })
    )
    const { recommendations } = await res.json()

    expect(ids(recommendations)).toEqual(['plc-a-wish'])
  })
})

// ──────────────────────────────────────────────
// 5. 회귀 — 커플 본인의 정상 흐름(SOLO 상태와 동일)은 그대로 동작한다
// ──────────────────────────────────────────────
describe('회귀 · 본인 커플의 정상 사용 흐름', () => {
  it('목록 → 상세 → 수정 → 삭제가 모두 성공한다', async () => {
    const listed = await listActivities(new NextRequest('http://localhost/api/activities'))
    expect(listed.status).toBe(200)
    expect((await listed.json()).data).toHaveLength(1)

    const detail = await getActivity(new NextRequest('http://localhost/x'), params('act-a-wish'))
    expect(detail.status).toBe(200)
    expect((await detail.json()).data.title).toBe('A의 한강 산책')

    const patched = await patchActivity(
      jsonReq('http://localhost/x', 'PATCH', { title: '한강 자전거', status: 'visited' }),
      params('act-a-wish')
    )
    expect(patched.status).toBe(200)
    expect(rowById('activities', 'act-a-wish')!.title).toBe('한강 자전거')

    const deleted = await deleteActivity(
      new NextRequest('http://localhost/x', { method: 'DELETE' }),
      params('act-a-wish')
    )
    expect(deleted.status).toBe(200)
    expect(rowById('activities', 'act-a-wish')).toBeUndefined()
  })

  it('다이닝 생성 → 목록 노출 → 수정 → 삭제가 모두 성공한다', async () => {
    const created = await createPlace(
      jsonReq('http://localhost/api/places', 'POST', {
        title: '새 다이닝',
        area: '망원동',
        meal_times: ['lunch'],
      })
    )
    expect(created.status).toBe(201)
    const { data } = await created.json()
    expect(data.category_id).toBe(PLC_CAT) // 미분류 기본 카테고리 채움 유지

    const listed = await listPlaces(new NextRequest('http://localhost/api/places'))
    expect(ids((await listed.json()).data)).toContain(data.id)

    const patched = await patchPlace(
      jsonReq('http://localhost/x', 'PATCH', { title: '이름 바꾼 다이닝' }),
      params(data.id)
    )
    expect(patched.status).toBe(200)

    const deleted = await deletePlace(
      new NextRequest('http://localhost/x', { method: 'DELETE' }),
      params(data.id)
    )
    expect(deleted.status).toBe(200)
    expect(rowById('places', data.id)).toBeUndefined()
  })

  it('추천 → 선택 기록이 본인 로그에는 성공한다', async () => {
    const rec = await recommendActivity(
      jsonReq('http://localhost/api/recommend/activity', 'POST', { duration_bucket: 'half' })
    )
    const { log_id, recommendations } = await rec.json()
    expect(recommendations.length).toBeGreaterThan(0)

    const selected = await selectRecommendation(
      jsonReq('http://localhost/api/recommend/select', 'POST', {
        log_id,
        selected_id: SELECTED_ID,
      })
    )

    expect(selected.status).toBe(200)
    expect(rowById('recommendations_log', log_id)!.selected_id).toBe(SELECTED_ID)
  })

  it('기존 커플 로그(LOG_A)에도 선택이 기록된다', async () => {
    const res = await selectRecommendation(
      jsonReq('http://localhost/api/recommend/select', 'POST', {
        log_id: LOG_A,
        selected_id: SELECTED_ID,
      })
    )

    expect(res.status).toBe(200)
    expect(rowById('recommendations_log', LOG_A)!.selected_id).toBe(SELECTED_ID)
  })

  it('커플이 1개뿐인 SOLO 상태에서도 목록·집계가 정상이다', async () => {
    // B 의 행을 모두 제거해 프로덕션(커플 1개) 상태를 재현한다.
    for (const table of ['activities', 'places', 'recommendations_log']) {
      db[table] = db[table].filter((r) => r.couple_id !== COUPLE_B)
    }

    const listed = await listActivities(new NextRequest('http://localhost/api/activities'))
    expect(ids((await listed.json()).data)).toEqual(['act-a-wish'])

    const stats = await (await dashboardStats()).json()
    expect(stats.wishlistActivities).toBe(1)
    expect(stats.visitedActivities).toBe(1)
    expect(stats.wishlistPlaces).toBe(1)
  })
})

// ──────────────────────────────────────────────
// 6. 세션에 커플이 없을 때 — 필터 없는 전체 조회로 흐르지 않는다
// ──────────────────────────────────────────────
describe('격리 · couple_id 없는 세션', () => {
  beforeEach(() => {
    session = { authenticated: true } // 전환 이전에 발급된 쿠키
  })

  it('목록 GET 은 401 이고 데이터를 흘리지 않는다', async () => {
    const res = await listActivities(new NextRequest('http://localhost/api/activities'))

    expect(res.status).toBe(401)
    expect(await res.json()).not.toHaveProperty('data')
  })

  it('생성 POST 은 401 이고 행이 만들어지지 않는다', async () => {
    const before = db.activities.length
    const res = await createActivity(
      jsonReq('http://localhost/api/activities', 'POST', {
        title: '주인 없는 행',
        location_type: 'indoor',
        duration_bucket: 'half',
      })
    )

    expect(res.status).toBe(401)
    expect(db.activities).toHaveLength(before)
  })

  it('삭제 DELETE 은 401 이고 행이 지워지지 않는다', async () => {
    const res = await deleteActivity(
      new NextRequest('http://localhost/x', { method: 'DELETE' }),
      params('act-a-wish')
    )

    expect(res.status).toBe(401)
    expect(rowById('activities', 'act-a-wish')).toBeDefined()
  })

  it('대시보드 집계는 401 이다', async () => {
    expect((await dashboardStats()).status).toBe(401)
  })
})
