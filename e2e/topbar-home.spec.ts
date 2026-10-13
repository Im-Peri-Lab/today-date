import { test, expect } from '@playwright/test'
import { authCookies } from './helpers/auth'
import { mockActivityCategories } from './helpers/mocks'

/**
 * 좌측 뒤로가기와 우측 홈 아이콘은 각자 위치 기준으로 항상 존재한다(SKILL.md §13).
 * 좌측 링크의 목적지가 `/`여도 지우지 않고, 우측 홈 아이콘과 같은 목적지로 공존한다.
 * (DB 를 읽는 /account · /account/delete · /partner 는 스텁 상태가 필요해 e2e/db/isolation.spec.ts 에 있다.)
 */
test.describe('TopBar — 좌측 뒤로가기 + 우측 홈 아이콘', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies(await authCookies())
    await mockActivityCategories(page)
  })

  const HOME_BACK_SCREENS = [
    '/recommend/activity',
    '/recommend/place',
    '/activities/new',
    '/places/new',
  ]

  for (const path of HOME_BACK_SCREENS) {
    test(`${path}: 좌측 "홈으로" 링크와 우측 홈 아이콘이 모두 / 로 간다`, async ({ page }) => {
      await page.goto(path)

      const links = page.getByRole('link', { name: '홈으로' })
      await expect(links).toHaveCount(2)
      await expect(links.nth(0)).toHaveAttribute('href', '/')
      await expect(links.nth(1)).toHaveAttribute('href', '/')

      const left = (await links.nth(0).boundingBox())!
      const right = (await links.nth(1).boundingBox())!
      const viewport = page.viewportSize()!
      expect(left.x).toBeLessThan(viewport.width / 2)
      expect(right.x + right.width / 2).toBeGreaterThan(viewport.width / 2)
    })
  }

  test('위저드 2단계에서는 좌측 "처음부터"(리셋)와 우측 홈 아이콘이 공존한다', async ({ page }) => {
    await page.goto('/recommend/activity')
    await page.getByRole('button', { name: /반나절/ }).click()
    await expect(page.getByText('언제 만날까요?')).toBeVisible()

    const back = page.getByRole('button', { name: '처음부터' })
    const home = page.getByRole('link', { name: '홈으로' })
    await expect(home).toHaveCount(1)
    const b = (await back.boundingBox())!
    const h = (await home.boundingBox())!
    expect(b.x).toBeLessThan(h.x)
  })
})
