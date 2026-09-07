import { test, expect, type Page } from '@playwright/test'
import bcrypt from 'bcryptjs'
import { coupleSessionCookies, legacySessionCookies } from '../helpers/auth'
import { refs, resetStub, stubInsert, stubRowById, stubRows } from '../helpers/stub'

/**
 * 커플 데이터 격리 + 인증 회귀 — 실제 브라우저, 실제 HTTP, 실제 라우트.
 *
 * 기존 위저드 스펙과 다른 점: /api/* 를 mocking 하지 않는다. 요청은 브라우저 →
 * Next 서버 → 미들웨어 → 라우트 핸들러 → supabase-js → PostgREST 스텁까지 전 구간을
 * 실제로 흐른다. 그래서 "서버가 남의 커플 행을 실제로 걸러내는가"를 볼 수 있다.
 *
 * 프로덕션에는 커플이 1개뿐이라 침범 테스트가 불가능하다. 스텁 DB 에 커플 A/B 를
 * 심어(e2e/stub/seed.json) A 의 세션으로 B 의 데이터를 노리는 경로를 전부 확인한다.
 *
 * 응답 코드만 보지 않는다 — 404 를 주면서 행을 지웠을 수도, 200 을 주면서 아무것도
 * 안 바꿨을 수도 있다. 침범 시도 뒤에는 항상 스텁 DB 의 최종 상태를 함께 본다.
 */

/** 커플 A 로 "로그인"한다(스텁 DB 에 실제로 존재하는 커플 — 세션 검증도 DB 를 거친다). */
async function loginAsA(page: Page) {
  await page.context().addCookies(
    await coupleSessionCookies({ coupleId: refs.coupleA, userId: refs.userA })
  )
}

async function loginAsB(page: Page) {
  await page.context().addCookies(
    await coupleSessionCookies({ coupleId: refs.coupleB, userId: refs.userB })
  )
}

/**
 * 로그인된 브라우저 안에서 API 를 직접 호출한다.
 *
 * 세션 쿠키가 그대로 실린 실제 요청이다 — 남의 행 id 를 알아낸 사용자가 콘솔에서
 * 할 수 있는 일과 동일하다. UI 를 거치지 않는 이유가 바로 이것으로, 화면에 버튼이
 * 없어도 서버가 막아야 한다.
 */
async function apiCall(
  page: Page,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: Record<string, unknown> | null }> {
  return page.evaluate(
    async ([method, path, bodyJson]) => {
      const init: RequestInit = { method, headers: {} }
      if (bodyJson) {
        init.headers = { 'Content-Type': 'application/json' }
        init.body = bodyJson as string
      }
      const res = await fetch(path as string, init)
      let json: Record<string, unknown> | null = null
      try { json = await res.json() } catch { json = null }
      return { status: res.status, json }
    },
    [method, path, body === undefined ? null : JSON.stringify(body)] as const
  )
}

/**
 * 목록이 그려질 때까지 기다린다.
 *
 * react-query 로딩이 끝나면 카드(h3 제목) 또는 빈 상태 문구 중 하나가 나온다
 * (§ ListView 의 EmptyState). 둘 중 무엇이든 나오면 "서버 응답을 받아 렌더를 끝냈다"는
 * 뜻이므로, 이 시점 이후의 "안 보인다" 단정이 로딩 중 스냅샷이 아님을 보장한다.
 */
async function waitForList(page: Page) {
  const rendered = page
    .locator('h3')
    .first()
    .or(page.getByText('찾으시는 항목이 없어요 💜'))
    .or(page.getByText(/추가해 보세요/))
  await expect(rendered.first()).toBeVisible({ timeout: 15_000 })
}

test.beforeEach(async () => {
  await resetStub('twoCouples')
})

// ──────────────────────────────────────────────
// 1. 목록 — 커플 B 데이터가 화면에 없다
// ──────────────────────────────────────────────
test.describe('격리 · 목록 조회', () => {
  test('커플 A 세션의 액티비티 목록에 커플 B 데이터가 보이지 않는다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list')
    await waitForList(page)

    await expect(page.getByText(refs.titleActA1)).toBeVisible()
    await expect(page.getByText(refs.titleActA2)).toBeVisible()
    await expect(page.getByText(refs.titleActB1)).toHaveCount(0)
  })

  test('커플 A 세션의 다이닝 목록에 커플 B 데이터가 보이지 않는다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list?tab=place')
    await waitForList(page)

    await expect(page.getByText(refs.titlePlcA1)).toBeVisible()
    await expect(page.getByText(refs.titlePlcB1)).toHaveCount(0)
  })

  test('검색으로도 커플 B 데이터를 끌어올 수 없다', async ({ page }) => {
    await loginAsA(page)
    // "비밀"은 커플 B 행의 제목·메모에만 있는 단어다(서버의 or(title.ilike, memo.ilike) 경로).
    await page.goto('/list?q=비밀')
    await waitForList(page)

    await expect(page.getByText(refs.titleActB1)).toHaveCount(0)
    await expect(page.getByText(refs.titleActA1)).toHaveCount(0) // 검색 자체는 동작한다(A 것도 안 걸림)
  })

  test('홈 대시보드 집계에 커플 B 의 개수·제목이 섞이지 않는다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/')

    // 커플 A 의 위시리스트는 액티비티 2건 / 다이닝 1건. B 의 2건은 포함되지 않아야 한다.
    const stats = await apiCall(page, 'GET', '/api/dashboard/stats')
    expect(stats.status).toBe(200)
    expect(stats.json).toMatchObject({ wishlistActivities: 2, wishlistPlaces: 1 })
    expect(stats.json?.wishlistActivityTitles).not.toContain(refs.titleActB1)
  })
})

// ──────────────────────────────────────────────
// 2. 상세 URL 직접 접근 — 404
// ──────────────────────────────────────────────
test.describe('격리 · 상세 직접 접근', () => {
  test('커플 B 소유 액티비티 URL 로 직접 들어가면 404 다', async ({ page }) => {
    await loginAsA(page)
    const res = await page.goto(`/activities/${refs.actB1}`)

    expect(res?.status()).toBe(404)
    await expect(page.getByText(refs.titleActB1)).toHaveCount(0)
  })

  test('커플 B 소유 다이닝 URL 로 직접 들어가면 404 다', async ({ page }) => {
    await loginAsA(page)
    const res = await page.goto(`/places/${refs.plcB1}`)

    expect(res?.status()).toBe(404)
    await expect(page.getByText(refs.titlePlcB1)).toHaveCount(0)
  })

  test('본인 커플 상세는 정상적으로 열린다 (회귀)', async ({ page }) => {
    await loginAsA(page)
    const res = await page.goto(`/activities/${refs.actA1}`)

    expect(res?.status()).toBe(200)
    await expect(page.getByText(refs.titleActA1).first()).toBeVisible()
  })

  test('API 상세도 남의 행과 없는 행을 구별하지 않는다 (403 이 아니라 404)', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list')

    const foreign = await apiCall(page, 'GET', `/api/activities/${refs.actB1}`)
    const missing = await apiCall(page, 'GET', '/api/activities/does-not-exist-at-all')

    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    // 존재 여부가 응답 차이로 새지 않아야 한다 — id 대입으로 열거할 수 없게 만든 지점.
    expect(foreign.json).toEqual(missing.json)
  })
})

// ──────────────────────────────────────────────
// 3. 수정/삭제 침범 — 404 이고 DB 가 실제로 안 바뀐다
// ──────────────────────────────────────────────
test.describe('격리 · 수정/삭제 침범', () => {
  test('커플 B 소유 액티비티 PATCH → 404, 값이 그대로다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list')

    const res = await apiCall(page, 'PATCH', `/api/activities/${refs.actB1}`, { title: '탈취됨' })

    expect(res.status).toBe(404)
    const row = await stubRowById<{ title: string }>('activities', refs.actB1)
    expect(row?.title).toBe(refs.titleActB1)
  })

  test('커플 B 소유 액티비티 DELETE → 404, 행이 남아 있다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list')

    const res = await apiCall(page, 'DELETE', `/api/activities/${refs.actB1}`)

    expect(res.status).toBe(404)
    expect(await stubRowById('activities', refs.actB1)).toBeDefined()
  })

  test('커플 B 소유 다이닝 PATCH → 404, 값이 그대로다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list?tab=place')

    const res = await apiCall(page, 'PATCH', `/api/places/${refs.plcB1}`, { title: '탈취됨' })

    expect(res.status).toBe(404)
    const row = await stubRowById<{ title: string }>('places', refs.plcB1)
    expect(row?.title).toBe(refs.titlePlcB1)
  })

  test('커플 B 소유 다이닝 DELETE → 404, 행이 남아 있다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list?tab=place')

    const res = await apiCall(page, 'DELETE', `/api/places/${refs.plcB1}`)

    expect(res.status).toBe(404)
    expect(await stubRowById('places', refs.plcB1)).toBeDefined()
  })

  test('본인 커플 행의 수정·삭제는 정상 동작한다 (회귀)', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list')

    const patched = await apiCall(page, 'PATCH', `/api/activities/${refs.actA2}`, {
      title: '이름 바꾼 액티비티',
    })
    expect(patched.status).toBe(200)
    const row = await stubRowById<{ title: string }>('activities', refs.actA2)
    expect(row?.title).toBe('이름 바꾼 액티비티')

    const deleted = await apiCall(page, 'DELETE', `/api/activities/${refs.actA2}`)
    expect(deleted.status).toBe(200)
    expect(await stubRowById('activities', refs.actA2)).toBeUndefined()
  })
})

// ──────────────────────────────────────────────
// 4. 생성 — 소유자는 세션이 정하고, 남의 목록에 안 나타난다
// ──────────────────────────────────────────────
test.describe('격리 · 생성', () => {
  test('커플 A 가 만든 데이터가 커플 B 세션에서 보이지 않는다', async ({ page, browser }) => {
    await loginAsA(page)
    await page.goto('/list')

    const created = await apiCall(page, 'POST', '/api/activities', {
      title: 'A커플만 볼 수 있어야 하는 행',
      location_type: 'indoor',
      duration_bucket: 'half',
    })
    expect(created.status).toBe(201)
    const createdId = (created.json?.data as { id: string }).id

    // 소유자가 세션값으로 박혔는지 DB 에서 직접 확인한다.
    const row = await stubRowById<{ couple_id: string }>('activities', createdId)
    expect(row?.couple_id).toBe(refs.coupleA)

    // 커플 B 의 새 브라우저 컨텍스트로 확인 — 쿠키가 섞이지 않게 컨텍스트를 분리한다.
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await loginAsB(pageB)
    await pageB.goto('/list')
    await waitForList(pageB)

    await expect(pageB.getByText('A커플만 볼 수 있어야 하는 행')).toHaveCount(0)
    await expect(pageB.getByText(refs.titleActB1)).toBeVisible()

    const detail = await apiCall(pageB, 'GET', `/api/activities/${createdId}`)
    expect(detail.status).toBe(404)

    await contextB.close()
  })

  test('클라이언트가 보낸 couple_id 는 무시되고 세션 커플로 생성된다', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/list')

    const created = await apiCall(page, 'POST', '/api/activities', {
      title: 'B커플 소유로 심으려는 행',
      location_type: 'indoor',
      duration_bucket: 'half',
      couple_id: refs.coupleB, // 침범 시도
    })
    expect(created.status).toBe(201)

    const createdId = (created.json?.data as { id: string }).id
    const row = await stubRowById<{ couple_id: string }>('activities', createdId)
    expect(row?.couple_id).toBe(refs.coupleA)
  })

  test('UI 로 다이닝을 등록하면 세션 커플 소유로 저장된다 (회귀)', async ({ page }) => {
    await loginAsA(page)
    await page.goto('/places/new')

    await page.getByLabel('제목').fill('E2E 새 다이닝')
    await page.getByLabel('지역').fill('망원동')
    // 식사 시간은 하나 이상 필수(서버 스키마와 동일 제약).
    await page.getByRole('button', { name: '점심', exact: true }).click()
    await page.getByRole('button', { name: '다이닝 등록하기' }).click()

    // 등록 성공 시 상세로 이동한다(§ PlaceForm.onSubmit).
    await page.waitForURL(/\/places\/[0-9a-f-]+/, { timeout: 15_000 })

    const rows = await stubRows<{ title: string; couple_id: string }>('places')
    const created = rows.find((r) => r.title === 'E2E 새 다이닝')
    expect(created).toBeDefined()
    // 014 에서 couple_id 가 NOT NULL 이 됐고 스텁도 그 제약을 재현한다 —
    // 라우트가 세션값을 채우지 않으면 여기서 등록 자체가 실패한다.
    expect(created?.couple_id).toBe(refs.coupleA)
  })
})

// ──────────────────────────────────────────────
// 5. 인증 회귀
// ──────────────────────────────────────────────
test.describe('인증 회귀', () => {
  test('couple_id 없는 구 세션은 /lock 으로 리다이렉트된다', async ({ page }) => {
    await page.context().addCookies(await legacySessionCookies())
    await page.goto('/')

    await expect(page).toHaveURL(/\/lock$/)
    // 만료 처리이므로 세션 쿠키도 지워져야 한다 — 다음 요청이 같은 쿠키로 재시도되면 안 된다.
    const cookies = await page.context().cookies()
    expect(cookies.find((c) => c.name === 'today-date-session')?.value ?? '').toBe('')
  })

  test('세션 없이 보호 경로에 접근하면 /lock 으로 보낸다', async ({ page }) => {
    await page.goto('/list')

    await expect(page).toHaveURL(/\/lock$/)
  })

  test('초대 링크 없이 신규 이메일로 가입하면 SOLO 상태로 정상 진입한다', async ({ page }) => {
    // 커플이 0개인 상태에서 시작 — 최초 설정 플로우.
    await resetStub('empty')

    await page.goto('/setup')
    await expect(page).toHaveURL(/\/setup/)

    // 1) 이메일 입력 → 인증 메일 발송 요청.
    //    RESEND_FROM_EMAIL 이 비어 있어 실제 발송은 실패하지만, send-verify 는
    //    사용자 열거 방지를 위해 항상 200 을 준다(§ src/app/api/auth/setup/send-verify).
    await page.getByLabel('이메일 주소').fill(refs.signupEmail)
    await page.getByRole('button', { name: '인증 메일 발송' }).click()

    // 2단계(메일 확인 안내)로 넘어갔는지 = send-verify 가 200 을 준 것.
    await expect(page.getByText('메일을 확인해 주세요')).toBeVisible({ timeout: 15_000 })

    // 커플·사용자 행이 실제로 만들어졌는지 DB 에서 확인한다.
    await expect
      .poll(async () => (await stubRows('users')).length, { timeout: 15_000 })
      .toBe(1)
    const couples = await stubRows<{ id: string }>('couples')
    expect(couples).toHaveLength(1)
    const users = await stubRows<{ email: string; couple_id: string; email_verified: boolean }>('users')
    expect(users[0].email).toBe(refs.signupEmail)
    expect(users[0].couple_id).toBe(couples[0].id)
    expect(users[0].email_verified).toBe(false)

    // 2) 이메일 인증 — 토큰은 bcrypt 해시로만 저장되어 원문을 DB 에서 꺼낼 수 없다
    //    (§ src/lib/auth/tokens.ts). 그래서 원문을 아는 토큰을 직접 심는다.
    const rawToken = 'e2e-verify-token-for-solo-signup'
    await stubInsert('email_tokens', {
      token_hash: await bcrypt.hash(rawToken, 10),
      purpose: 'verify_email',
      target_email: refs.signupEmail,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      used_at: null,
    })

    await page.goto(`/setup/verify?token=${rawToken}`)
    await expect
      .poll(
        async () => (await stubRows<{ email_verified: boolean }>('users'))[0]?.email_verified,
        { timeout: 15_000 }
      )
      .toBe(true)

    // 3) 패스코드 설정. /setup/verify 는 서버 컴포넌트가 검증 후
    //    /setup?verified=true 로 리다이렉트하고, 그 화면이 3단계(패스코드)로 열린다.
    await expect(page).toHaveURL(/\/setup\?verified=true/)
    await expect(page.getByText('패스코드 설정')).toBeVisible()

    // PasscodeInput 은 물리 키보드 입력을 받는다(§ src/components/PasscodeInput.tsx).
    // 6자리를 채우면 확인 단계로 넘어가고, 같은 값을 다시 넣어야 API 가 호출된다.
    await page.keyboard.type('135791')
    await expect(page.getByText('패스코드 확인')).toBeVisible()
    await page.keyboard.type('135791')

    // 설정 완료 → 홈으로 이동(§ onConfirmPasscodeComplete 의 router.push('/')).
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 })

    // 커플에 패스코드가 저장됐는지 = 설정 완료(SOLO) 조건 충족.
    const couplesAfter = await stubRows<{ passcode_hash: string | null }>('couples')
    expect(couplesAfter[0].passcode_hash).toBeTruthy()

    // SOLO 상태(커플 1 + 사용자 1)로 앱을 정상 사용할 수 있어야 한다.
    await expect(page).not.toHaveURL(/\/lock/)
    await expect(page).not.toHaveURL(/\/setup/)

    const stats = await apiCall(page, 'GET', '/api/dashboard/stats')
    expect(stats.status).toBe(200)
    expect(stats.json).toMatchObject({ wishlistActivities: 0, wishlistPlaces: 0 })
  })
})
