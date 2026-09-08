import { test, expect, type Page } from '@playwright/test'
import bcrypt from 'bcryptjs'
import { coupleSessionCookies, legacySessionCookies, readSessionCookie } from '../helpers/auth'
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

/** solo/paired 시나리오의 커플로 로그인한다(멤버 1명 → 초대 발송 주체). */
async function loginAsSolo(page: Page) {
  await page.context().addCookies(
    await coupleSessionCookies({ coupleId: refs.soloCouple, userId: refs.soloUser })
  )
}

/** paired 시나리오에서 나중에 합류한 파트너로 로그인한다. */
async function loginAsPartner(page: Page) {
  await page.context().addCookies(
    await coupleSessionCookies({ coupleId: refs.soloCouple, userId: refs.partnerUser })
  )
}

/**
 * 초대 토큰을 원문을 알고 있는 상태로 심는다.
 *
 * 앱이 만든 토큰은 bcrypt 해시로만 저장되어 원문을 DB 에서 꺼낼 수 없다
 * (§ src/lib/auth/tokens.ts). 초대 링크를 실제로 열어보는 스펙은 원문이 필요하므로
 * 발송 API 를 거치지 않고 직접 심는다 — 발송 API 의 동작은 별도 테스트에서 본다.
 *
 * couple_id 는 015 가 추가한 초대 스코프 컬럼이다. 이 값이 없으면 수락 라우트가
 * 어느 커플에 붙일지 알 수 없어 invalid_token 으로 닫힌다.
 */
async function plantInvite(opts: {
  rawToken: string
  email: string
  coupleId: string
  expiresInMinutes?: number
}) {
  await stubInsert('email_tokens', {
    token_hash: await bcrypt.hash(opts.rawToken, 10),
    purpose: 'invite_partner',
    target_email: opts.email,
    couple_id: opts.coupleId,
    expires_at: new Date(
      Date.now() + (opts.expiresInMinutes ?? 24 * 60) * 60 * 1000
    ).toISOString(),
    used_at: null,
  })
}

interface StubUserRow {
  id: string
  couple_id: string
  email: string
  email_verified: boolean
}

interface StubTokenRow {
  id: string
  purpose: string
  target_email: string
  couple_id: string | null
  expires_at: string
  used_at: string | null
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

// ──────────────────────────────────────────────
// 6. 파트너 초대 — SOLO → PAIRED 전환
//
// solo 시나리오(커플 1 + 사용자 1 + 위시리스트 3건)와 paired 시나리오(같은 커플에
// 사용자 2)를 오가며, 발송 가드·수락 처리·전환 후 격리 유지를 전 구간 실제 HTTP 로 본다.
// 응답 코드만 보지 않는다 — 초대 실패는 "토큰이 안 만들어졌는가", 수락 성공은
// "users 행이 그 커플에 붙었는가"까지 스텁 DB 에서 확인한다.
// ──────────────────────────────────────────────
test.describe('파트너 초대 · 발송', () => {
  test('SOLO 상태에서 초대를 보내면 24시간 invite_partner 토큰이 그 커플로 생긴다', async ({
    page,
  }) => {
    await resetStub('solo')
    await loginAsSolo(page)
    await page.goto('/')

    const sent = await apiCall(page, 'POST', '/api/auth/invite', {
      email: refs.partnerEmail,
    })
    expect(sent.status).toBe(200)

    const tokens = await stubRows<StubTokenRow>('email_tokens')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].purpose).toBe('invite_partner')
    expect(tokens[0].target_email).toBe(refs.partnerEmail)
    // 015 의 초대 스코프 컬럼 — 수락 시 어느 커플에 붙일지가 여기서만 온다.
    expect(tokens[0].couple_id).toBe(refs.soloCouple)
    expect(tokens[0].used_at).toBeNull()

    // 만료 24시간(±5분 여유 — 서버 시계와 테스트 시계의 차이만 허용).
    const ttlMinutes = (new Date(tokens[0].expires_at).getTime() - Date.now()) / 60_000
    expect(ttlMinutes).toBeGreaterThan(24 * 60 - 5)
    expect(ttlMinutes).toBeLessThan(24 * 60 + 5)

    // 발송은 users 를 만들지 않는다 — 합류는 수락 시점에만 일어난다.
    expect(await stubRows('users')).toHaveLength(1)
  })

  test('이미 가입된 이메일(본인)로는 발송 자체가 막힌다', async ({ page }) => {
    await resetStub('solo')
    await loginAsSolo(page)
    await page.goto('/')

    const sent = await apiCall(page, 'POST', '/api/auth/invite', {
      email: refs.soloEmail,
    })

    expect(sent.status).toBe(409)
    expect(sent.json?.error).toBe('이미 가입된 이메일입니다.')
    // 토큰이 만들어지지 않았는지까지 본다 — 409 를 주면서 토큰만 남기면
    // 그 링크로 users.email unique 위반을 향해 걸어 들어가게 된다.
    expect(await stubRows('email_tokens')).toHaveLength(0)
  })

  test('다른 커플에 이미 등록된 이메일로도 발송이 막힌다', async ({ page }) => {
    await resetStub('solo')
    // 다른 커플 소속 사용자를 심는다(users.email 은 전역 unique — 이 이메일은 어느 커플에도
    // 새로 붙을 수 없다). 커플 행은 심지 않는다: 미들웨어의 "커플이 1개인가" 판정을
    // 흔들지 않으면서 "이 이메일은 이미 남의 것"이라는 사실만 만들면 충분하다.
    await stubInsert('users', {
      couple_id: refs.coupleB,
      email: refs.outsiderEmail,
      email_verified: true,
    })

    await loginAsSolo(page)
    await page.goto('/')

    const sent = await apiCall(page, 'POST', '/api/auth/invite', {
      email: refs.outsiderEmail,
    })

    expect(sent.status).toBe(409)
    expect(sent.json?.error).toBe('이미 가입된 이메일입니다.')
    expect(await stubRows('email_tokens')).toHaveLength(0)
  })

  test('재초대하면 그 커플의 기존 대기 초대가 무효화된다 (유효한 초대는 항상 한 장)', async ({
    page,
  }) => {
    await resetStub('solo')
    // 먼저 보낸 초대 — 대상 이메일이 다르므로 (purpose, target_email) 기준 정리로는 안 지워진다.
    await plantInvite({
      rawToken: 'e2e-first-invite-token',
      email: 'first-invitee@example.com',
      coupleId: refs.soloCouple,
    })

    await loginAsSolo(page)
    await page.goto('/')

    const sent = await apiCall(page, 'POST', '/api/auth/invite', {
      email: refs.partnerEmail,
    })
    expect(sent.status).toBe(200)

    const tokens = await stubRows<StubTokenRow>('email_tokens')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].target_email).toBe(refs.partnerEmail)

    // 무효화된 링크로는 합류할 수 없어야 한다.
    await page.goto('/invite?token=e2e-first-invite-token')
    await expect(page).toHaveURL(/\/lock\?invite=invalid$/)
    expect(await stubRows('users')).toHaveLength(1)
  })

  test('PAIRED 상태에서는 초대 발송이 차단된다', async ({ page }) => {
    await resetStub('paired')
    await loginAsSolo(page)
    await page.goto('/')

    const sent = await apiCall(page, 'POST', '/api/auth/invite', {
      email: 'third-person@example.com',
    })

    expect(sent.status).toBe(409)
    expect(sent.json?.error).toBe('이미 파트너와 연결되어 있습니다.')
    expect(await stubRows('email_tokens')).toHaveLength(0)
    expect(await stubRows('users')).toHaveLength(2)
  })

  test('세션 없이 초대 API 를 호출하면 401 이다', async ({ page }) => {
    await resetStub('solo')
    await page.goto('/lock')

    const sent = await apiCall(page, 'POST', '/api/auth/invite', {
      email: refs.partnerEmail,
    })

    expect(sent.status).toBe(401)
    expect(await stubRows('email_tokens')).toHaveLength(0)
  })
})

test.describe('파트너 초대 · 화면', () => {
  test('SOLO 홈에 초대 진입점이 있고 화면에서 초대를 보낼 수 있다', async ({ page }) => {
    await resetStub('solo')
    await loginAsSolo(page)
    await page.goto('/')

    await page.getByRole('link', { name: /파트너 초대/ }).click()
    await page.waitForURL(/\/partner$/, { timeout: 15_000 })

    await page.getByLabel('파트너 이메일').fill(refs.partnerEmail)
    await page.getByRole('button', { name: '초대 메일 보내기' }).click()

    await expect(page.getByText('초대 메일을 보냈어요').first()).toBeVisible({
      timeout: 15_000,
    })

    const tokens = await stubRows<StubTokenRow>('email_tokens')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].target_email).toBe(refs.partnerEmail)
    expect(tokens[0].couple_id).toBe(refs.soloCouple)
  })

  test('PAIRED 홈에는 초대 진입점이 없고 /partner 는 홈으로 되돌린다', async ({ page }) => {
    await resetStub('paired')
    await loginAsSolo(page)
    await page.goto('/')

    // 통계 섹션이 그려질 때까지 기다린 뒤 "없다"를 단정한다(로딩 중 스냅샷 방지).
    await expect(page.getByText('가보고 싶은 곳').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /파트너 초대/ })).toHaveCount(0)

    await page.goto('/partner')
    await expect(page).toHaveURL(/\/$/)
  })

  test('이미 가입된 이메일로 화면에서 초대하면 오류를 그대로 알려준다', async ({ page }) => {
    await resetStub('solo')
    await loginAsSolo(page)
    await page.goto('/partner')

    await page.getByLabel('파트너 이메일').fill(refs.soloEmail)
    await page.getByRole('button', { name: '초대 메일 보내기' }).click()

    // 사용자 열거 방지를 적용하지 않는 유일한 인증 경로다 — 초대가 왜 실패했는지
    // 알려주지 않으면 파트너가 메일을 못 받은 이유를 알 방법이 없다.
    await expect(page.getByText('이미 가입된 이메일입니다.')).toBeVisible({ timeout: 15_000 })
    expect(await stubRows('email_tokens')).toHaveLength(0)
  })
})

test.describe('파트너 초대 · 수락', () => {
  const RAW_INVITE = 'e2e-invite-token-for-partner-join'

  test('초대 링크로 들어오면 이메일 인증 없이 /lock 으로 가고 기존 패스코드로 세션이 발급된다', async ({
    page,
  }) => {
    await resetStub('solo')
    await plantInvite({
      rawToken: RAW_INVITE,
      email: refs.partnerEmail,
      coupleId: refs.soloCouple,
    })

    // 세션 쿠키 없이 들어온다 — 초대받은 사람은 아직 계정이 없다.
    // 이 요청이 /setup 이나 /lock 으로 튕기지 않는 것이 미들웨어 OPEN_PREFIXES 에
    // /invite 가 열려 있다는 증거다.
    await page.goto(`/invite?token=${RAW_INVITE}`)

    await expect(page).toHaveURL(/\/lock\?joined=1$/)
    await expect(page.getByText('파트너 연결이 완료됐어요 💜')).toBeVisible()

    // 새 커플이 만들어지지 않고 기존 커플에 users 행이 붙었는지 DB 에서 확인한다.
    expect(await stubRows('couples')).toHaveLength(1)
    const users = await stubRows<StubUserRow>('users')
    expect(users).toHaveLength(2)
    const partner = users.find((u) => u.email === refs.partnerEmail)
    expect(partner?.couple_id).toBe(refs.soloCouple)
    // 토큰 클릭 자체가 메일함 소유 증명 — 별도 인증 메일을 거치지 않는다.
    expect(partner?.email_verified).toBe(true)

    // 인증 메일 토큰이 새로 생기지 않았는지(= 인증 단계를 건너뛰었는지)도 본다.
    const tokens = await stubRows<StubTokenRow>('email_tokens')
    expect(tokens.filter((t) => t.purpose === 'verify_email')).toHaveLength(0)
    expect(tokens.find((t) => t.purpose === 'invite_partner')?.used_at).not.toBeNull()

    // 패스코드는 새로 설정하지 않는다 — 커플의 기존 패스코드를 그대로 입력한다.
    // (PasscodeInput 은 window keydown 을 받는다 — § src/components/PasscodeInput.tsx)
    await page.keyboard.type(refs.soloPasscode)
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 })

    // 세션이 "먼저 만들어진 사용자"가 아니라 방금 합류한 파트너로 발급됐는지.
    // 화면으로는 구분할 수 없다(데이터가 같다) — 서버가 심은 쿠키를 직접 열어 본다.
    const session = await readSessionCookie(page)
    expect(session?.authenticated).toBe(true)
    expect(session?.couple_id).toBe(refs.soloCouple)
    expect(session?.user_id).toBe(partner?.id)
    expect(session?.user_id).not.toBe(refs.soloUser)

    // 커플의 기존 데이터가 새 세션에서 그대로 보인다.
    const stats = await apiCall(page, 'GET', '/api/dashboard/stats')
    expect(stats.status).toBe(200)
    expect(stats.json).toMatchObject({ wishlistActivities: 2, wishlistPlaces: 1 })

    // 커플이 PAIRED 가 됐으므로 홈에서 초대 진입점이 사라진다.
    await expect(page.getByRole('link', { name: /파트너 초대/ })).toHaveCount(0)
  })

  test('같은 초대 링크를 두 번 열어도 두 번째는 거부된다 (used_at)', async ({ page }) => {
    await resetStub('solo')
    await plantInvite({
      rawToken: RAW_INVITE,
      email: refs.partnerEmail,
      coupleId: refs.soloCouple,
    })

    await page.goto(`/invite?token=${RAW_INVITE}`)
    await expect(page).toHaveURL(/\/lock\?joined=1$/)
    expect(await stubRows('users')).toHaveLength(2)

    await page.goto(`/invite?token=${RAW_INVITE}`)
    await expect(page).toHaveURL(/\/lock\?invite=invalid$/)
    // 사용자 행이 하나 더 붙지 않았는지 — 세 번째 사람이 끼어드는 경로가 없어야 한다.
    expect(await stubRows('users')).toHaveLength(2)
  })

  test('이미 PAIRED 인 커플의 초대 링크는 수락되지 않는다', async ({ page }) => {
    await resetStub('paired')
    await plantInvite({
      rawToken: RAW_INVITE,
      email: 'third-person@example.com',
      coupleId: refs.soloCouple,
    })

    await page.goto(`/invite?token=${RAW_INVITE}`)

    await expect(page).toHaveURL(/\/lock\?invite=paired$/)
    await expect(page.getByText('이미 두 사람이 연결된 커플이에요')).toBeVisible()
    expect(await stubRows('users')).toHaveLength(2)
  })

  /**
   * 이 경로는 두 겹으로 막혀 있다: 수락 직전의 getUserByEmail 재확인과, users.email
   * 전역 unique 위반(23505)을 null 로 받는 addCoupleUser 다. 변이 검증에서 앞의 재확인만
   * 무력화해도 이 스펙은 통과했다 — DB 제약이 같은 결과를 만들기 때문이다. 즉 이
   * 단정은 "재확인 코드가 있다"가 아니라 "이 상태에서 합류가 성립하지 않는다"를 고정한다.
   * 두 겹 중 하나라도 남아 있으면 통과하는 것이 의도다(제약을 지우면 잡힌다).
   */
  test('초대 발송 뒤 그 이메일이 다른 계정에 가입되면 수락이 거부된다 (경쟁 상황)', async ({
    page,
  }) => {
    await resetStub('solo')
    await plantInvite({
      rawToken: RAW_INVITE,
      email: refs.partnerEmail,
      coupleId: refs.soloCouple,
    })
    // 초대 발송 이후, 수락 전에 같은 이메일이 다른 커플에 등록된 상태를 만든다.
    await stubInsert('users', {
      couple_id: refs.coupleB,
      email: refs.partnerEmail,
      email_verified: true,
    })

    await page.goto(`/invite?token=${RAW_INVITE}`)

    await expect(page).toHaveURL(/\/lock\?invite=registered$/)
    await expect(page.getByText('이미 가입된 이메일이에요')).toBeVisible()
    // solo 커플에는 사용자가 붙지 않았다(전체 2건 = solo 1 + 다른 커플 1).
    const users = await stubRows<StubUserRow>('users')
    expect(users.filter((u) => u.couple_id === refs.soloCouple)).toHaveLength(1)
  })

  test('만료된 초대 링크는 거부된다', async ({ page }) => {
    await resetStub('solo')
    await plantInvite({
      rawToken: RAW_INVITE,
      email: refs.partnerEmail,
      coupleId: refs.soloCouple,
      expiresInMinutes: -1,
    })

    await page.goto(`/invite?token=${RAW_INVITE}`)

    await expect(page).toHaveURL(/\/lock\?invite=invalid$/)
    expect(await stubRows('users')).toHaveLength(1)
  })

  test('토큰 없이 /invite 를 열면 안내와 함께 /lock 으로 보낸다', async ({ page }) => {
    await resetStub('solo')

    await page.goto('/invite')

    await expect(page).toHaveURL(/\/lock\?invite=invalid$/)
    await expect(page.getByText('초대 링크가 유효하지 않아요')).toBeVisible()
    expect(await stubRows('users')).toHaveLength(1)
  })

  test('초대 쪽지가 없는 평소 잠금해제는 기존 사용자로 세션을 발급한다 (회귀)', async ({
    page,
  }) => {
    await resetStub('solo')
    await page.goto('/lock')

    await page.keyboard.type(refs.soloPasscode)
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 })

    // pending-user 쿠키가 없으면 pickSessionUser 경로 — 커플의 인증된 첫 사용자.
    const session = await readSessionCookie(page)
    expect(session?.couple_id).toBe(refs.soloCouple)
    expect(session?.user_id).toBe(refs.soloUser)
  })
})

test.describe('파트너 초대 · PAIRED 전환 후 격리', () => {
  test('두 파트너 세션이 같은 activities/places 를 보고, 남의 커플 행은 여전히 안 보인다', async ({
    page,
    browser,
  }) => {
    await resetStub('paired')
    // 다른 커플의 행 — PAIRED 가 됐다고 격리가 느슨해지지 않는지 확인하기 위한 대조군.
    await stubInsert('activities', {
      couple_id: refs.coupleB,
      title: '남의 커플 액티비티',
      category_id: refs.actCategory,
      duration_bucket: 'half',
      time_of_day: 'any',
      location_type: 'indoor',
    })

    await loginAsSolo(page)
    await page.goto('/list')
    await waitForList(page)

    const contextPartner = await browser.newContext()
    const pagePartner = await contextPartner.newPage()
    await loginAsPartner(pagePartner)
    await pagePartner.goto('/list')
    await waitForList(pagePartner)

    // 같은 커플의 위시리스트를 두 사람이 똑같이 본다.
    for (const p of [page, pagePartner]) {
      await expect(p.getByText(refs.titleActSolo1)).toBeVisible()
      await expect(p.getByText(refs.titleActSolo2)).toBeVisible()
      await expect(p.getByText('남의 커플 액티비티')).toHaveCount(0)
    }

    // API 응답의 id 집합이 완전히 같아야 한다 — 화면 문구가 아니라 서버 필터 결과 비교.
    const idsOf = async (p: Page) => {
      const res = await apiCall(p, 'GET', '/api/activities')
      expect(res.status).toBe(200)
      return ((res.json?.data as { id: string }[]) ?? []).map((r) => r.id).sort()
    }
    const soloIds = await idsOf(page)
    const partnerIds = await idsOf(pagePartner)
    expect(soloIds).toEqual([refs.actSolo1, refs.actSolo2].sort())
    expect(partnerIds).toEqual(soloIds)

    // 파트너가 만든 행도 커플 소유로 저장되고 상대에게 즉시 보인다.
    const created = await apiCall(pagePartner, 'POST', '/api/activities', {
      title: '파트너가 등록한 행',
      location_type: 'indoor',
      duration_bucket: 'half',
    })
    expect(created.status).toBe(201)
    const createdId = (created.json?.data as { id: string }).id
    const row = await stubRowById<{ couple_id: string }>('activities', createdId)
    expect(row?.couple_id).toBe(refs.soloCouple)

    const detail = await apiCall(page, 'GET', `/api/activities/${createdId}`)
    expect(detail.status).toBe(200)

    // 다이닝도 같은 커플 범위로 공유된다.
    for (const p of [page, pagePartner]) {
      await p.goto('/list?tab=place')
      await waitForList(p)
      await expect(p.getByText(refs.titlePlcSolo1)).toBeVisible()
    }

    await contextPartner.close()
  })
})

test.describe('파트너 초대 · 자가가입 시 대기 초대 확인', () => {
  test('대기 중인 초대가 있는 이메일로 자가가입하면 새 커플이 생기지 않고 기존 커플에 합류한다', async ({
    page,
  }) => {
    await resetStub('solo')
    await plantInvite({
      rawToken: 'e2e-pending-invite-not-in-mailbox',
      email: refs.partnerEmail,
      coupleId: refs.soloCouple,
    })

    await page.goto('/lock')

    // 초대 메일을 못 찾은 파트너가 직접 가입을 시도하는 흐름.
    const signup = await apiCall(page, 'POST', '/api/auth/setup/send-verify', {
      email: refs.partnerEmail,
    })
    expect(signup.status).toBe(200)
    // 화면이 "인증 메일" 대신 "초대 메일" 안내를 띄우게 하는 신호.
    expect(signup.json?.invite).toBe(true)

    // 커플도 사용자도 늘지 않았다 — 여기서 새 커플이 생기면 users.email 전역 unique 때문에
    // 나중에 초대 링크를 눌러도 합류가 영구히 막힌다.
    expect(await stubRows('couples')).toHaveLength(1)
    expect(await stubRows('users')).toHaveLength(1)

    // 인증 메일 토큰이 아니라 초대 토큰이 같은 커플로 다시 발급됐다.
    const tokens = await stubRows<StubTokenRow>('email_tokens')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].purpose).toBe('invite_partner')
    expect(tokens[0].couple_id).toBe(refs.soloCouple)
    expect(tokens[0].target_email).toBe(refs.partnerEmail)

    // 재발급된 토큰의 원문은 메일함에만 있으므로, 합류까지 이어지는지는 원문을 아는
    // 토큰을 새로 심어 확인한다(재발급 자체는 위 단정으로 이미 검증됐다).
    await plantInvite({
      rawToken: 'e2e-invite-after-selfsignup',
      email: refs.partnerEmail,
      coupleId: refs.soloCouple,
    })
    await page.goto('/invite?token=e2e-invite-after-selfsignup')

    await expect(page).toHaveURL(/\/lock\?joined=1$/)
    expect(await stubRows('couples')).toHaveLength(1)
    const users = await stubRows<StubUserRow>('users')
    expect(users).toHaveLength(2)
    expect(users.find((u) => u.email === refs.partnerEmail)?.couple_id).toBe(refs.soloCouple)
  })

  test('대기 초대가 없는 이메일의 자가가입은 여전히 차단된다 (회귀)', async ({ page }) => {
    await resetStub('solo')
    await page.goto('/lock')

    const signup = await apiCall(page, 'POST', '/api/auth/setup/send-verify', {
      email: 'stranger@example.com',
    })

    // 초대 확인 분기가 "설정 완료" 게이트를 우회하는 구멍이 되지 않았는지.
    expect(signup.status).toBe(409)
    expect(signup.json?.error).toBe('이미 설정이 완료된 앱입니다.')
    expect(await stubRows('couples')).toHaveLength(1)
    expect(await stubRows('users')).toHaveLength(1)
    expect(await stubRows('email_tokens')).toHaveLength(0)
  })
})
