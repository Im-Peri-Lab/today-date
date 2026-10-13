import { test, expect } from '@playwright/test'
import { authCookies } from './helpers/auth'
import { mockActivityCategories } from './helpers/mocks'

test.describe('TopBar — 홈 아이콘 우측 고정', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies(await authCookies())
    await mockActivityCategories(page)
  })

  test('위저드 1단계(좌측 슬롯 비어 있음)에서도 홈 아이콘은 우측에 있고 / 로 간다', async ({ page }) => {
    await page.goto('/recommend/activity')
    await expect(page.getByText('얼마나 시간을 낼 수 있어요?')).toBeVisible()

    const home = page.getByRole('link', { name: '홈으로' })
    await expect(home).toHaveCount(1)
    await expect(home).toHaveAttribute('href', '/')

    const box = (await home.boundingBox())!
    const card = (await page.locator('h1').boundingBox())!
    const viewport = page.viewportSize()!
    // 홈 아이콘 중심이 뷰포트 중앙보다 오른쪽 — 좌측으로 쏠리지 않았는지.
    expect(box.x + box.width / 2).toBeGreaterThan(viewport.width / 2)
    expect(card).toBeTruthy()
  })

  test('위저드 2단계에서는 좌측 "처음부터"와 우측 홈 아이콘이 공존한다', async ({ page }) => {
    await page.goto('/recommend/activity')
    await page.getByRole('button', { name: /반나절/ }).click()
    await expect(page.getByText('언제 만날까요?')).toBeVisible()

    const back = page.getByRole('button', { name: '처음부터' })
    const home = page.getByRole('link', { name: '홈으로' })
    const b = (await back.boundingBox())!
    const h = (await home.boundingBox())!
    expect(b.x).toBeLessThan(h.x)
  })
})
