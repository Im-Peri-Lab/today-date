import { test, expect, type Page } from '@playwright/test'
import { coupleSessionCookies } from '../helpers/auth'
import { refs, resetStub } from '../helpers/stub'

/**
 * 예정일과 함께 등록한 항목이 상세에 도착하면 "캘린더에도 추가할까요?" 제안을 1회 띄운다.
 * - 예정일 없음 / 연속 등록("계속 등록") 저장 / 새로고침·뒤로가기 재진입에서는 뜨지 않는다.
 * - 제안의 [추가]는 기존 머리말 첫 안내 다이얼로그를 거친다.
 */
const OFFER = '캘린더에도 추가할까요?'

async function signedIn(browser: import('@playwright/test').Browser) {
  await resetStub('twoCouples')
  const ctx = await browser.newContext()
  await ctx.addCookies(await coupleSessionCookies({ coupleId: refs.coupleA, userId: refs.userA }))
  return ctx
}

async function fillActivity(page: Page, title: string, plannedAt?: string, { open = true } = {}) {
  if (open) await page.goto('/activities/new')
  await page.locator('#title').fill(title)
  await page.getByRole('button', { name: '실내', exact: true }).click()
  await page.getByRole('button', { name: '반나절', exact: true }).click()
  await page.getByRole('button', { name: '주간', exact: true }).click()
  if (plannedAt) await page.locator('#planned_at').fill(plannedAt)
}

async function fillPlace(page: Page, title: string, plannedAt?: string) {
  await page.goto('/places/new')
  await page.locator('#title').fill(title)
  await page.getByRole('button', { name: '점심', exact: true }).click()
  await page.locator('#area').fill('연남동')
  if (plannedAt) await page.locator('#planned_at').fill(plannedAt)
}

test('활동: 예정일과 함께 등록하면 상세 도착 시 제안 1회, 새로고침·뒤로가기로는 다시 안 뜬다', async ({ browser }) => {
  const ctx = await signedIn(browser)
  const page = await ctx.newPage()
  await fillActivity(page, '캘린더 제안 테스트', '2026-12-25')
  await page.getByRole('button', { name: '액티비티 등록하기' }).click()
  await expect(page).toHaveURL(/\/activities\/[^/?]+/)
  const offer = page.getByText(OFFER)
  await expect(offer).toBeVisible()
  await expect(page.getByRole('button', { name: '추가', exact: true })).toBeVisible()
  // 성공 문구는 없어야 한다(목적지 자기확인 원칙)
  await expect(page.getByText(/등록했어요/)).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('heading', { name: '캘린더 제목 문구' })).toHaveCount(0)
  await expect(page.getByText(OFFER)).toHaveCount(0)

  await page.goBack()
  await page.goForward()
  await expect(page.getByText(OFFER)).toHaveCount(0)
  await ctx.close()
})

test('활동: 예정일 없이 등록하면 상세에서 제안이 뜨지 않는다', async ({ browser }) => {
  const ctx = await signedIn(browser)
  const page = await ctx.newPage()
  await fillActivity(page, '예정일 없음')
  await page.getByRole('button', { name: '액티비티 등록하기' }).click()
  await expect(page).toHaveURL(/\/activities\/[^/?]+/)
  await expect(page.getByRole('heading', { name: '예정일 없음' })).toBeVisible()
  await expect(page.getByText(OFFER)).toHaveCount(0)
  await ctx.close()
})

test('활동: 제안의 [추가]는 머리말 첫 안내 다이얼로그를 거친다', async ({ browser }) => {
  const ctx = await signedIn(browser)
  const page = await ctx.newPage()
  await fillActivity(page, '머리말 확인', '2026-12-25')
  await page.getByRole('button', { name: '액티비티 등록하기' }).click()
  await expect(page.getByText(OFFER)).toBeVisible()
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await expect(page.getByRole('heading', { name: '캘린더 제목 문구' })).toBeVisible()
  await ctx.close()
})

test('다이닝: 예정일과 함께 등록하면 상세 도착 시 제안이 뜬다', async ({ browser }) => {
  const ctx = await signedIn(browser)
  const page = await ctx.newPage()
  await fillPlace(page, '다이닝 제안 테스트', '2026-12-25')
  await page.getByRole('button', { name: '다이닝 등록하기' }).click()
  await expect(page).toHaveURL(/\/places\/[^/?]+/)
  await expect(page.getByText(OFFER)).toBeVisible()
  await page.reload()
  await expect(page.getByText(OFFER)).toHaveCount(0)
  await ctx.close()
})

test('계속 등록으로 저장한 항목에는 제안이 뜨지 않고, 최종 등록은 목록으로 간다', async ({ browser }) => {
  const ctx = await signedIn(browser)
  const page = await ctx.newPage()
  await fillActivity(page, '계속 1', '2026-12-25')
  await page.getByRole('button', { name: '저장하고 계속 등록하기' }).click()
  await expect(page.getByText(OFFER)).toHaveCount(0)
  // 같은 화면에서 이어서 채운다(다시 열면 연속 등록 상태가 초기화된다)
  await fillActivity(page, '계속 2', '2026-12-26', { open: false })
  await page.getByRole('button', { name: '액티비티 등록하기' }).click()
  await expect(page).toHaveURL(/\/list/)
  await expect(page.getByText(OFFER)).toHaveCount(0)
  await ctx.close()
})

for (const scheme of ['light', 'dark'] as const) {
  test(`일반 토스트 배경은 불투명하다(${scheme}) — 상단 바 위에서 글자가 비치지 않음`, async ({ browser }) => {
    await resetStub('twoCouples')
    const ctx = await browser.newContext({ colorScheme: scheme })
    await ctx.addCookies(await coupleSessionCookies({ coupleId: refs.coupleA, userId: refs.userA }))
    const page = await ctx.newPage()
    await fillActivity(page, '토스트 배경', '2026-12-25')
    await page.getByRole('button', { name: '액티비티 등록하기' }).click()
    await expect(page.getByText(OFFER)).toBeVisible()
    const bg = await page.locator('[data-sonner-toast]').evaluate((el) => getComputedStyle(el).backgroundColor)
    // rgba(0, 0, 0, 0) 같은 투명값이 아니고 알파가 1인 불투명 색이어야 한다
    expect(bg).toMatch(/^rgb\(/)
    await ctx.close()
  })
}
