import { test, expect } from '@playwright/test'
import { authCookies } from './helpers/auth'
import { mockActivityCategories } from './helpers/mocks'

test.describe('활동 추천 위저드 — 뒤로가기 네비게이션', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies(await authCookies())
    await mockActivityCategories(page)
  })

  test('1단계에서 조건 선택 → 다음 단계 이동 → 브라우저 뒤로가기 시 이전 단계와 선택값을 유지한다', async ({
    page,
  }) => {
    await page.goto('/recommend/activity')

    await expect(page.getByText('얼마나 시간을 낼 수 있어요?')).toBeVisible()
    await page.getByRole('button', { name: /반나절/ }).click()

    // 다음 단계(시간대 선택)로 넘어갔는지 + URL이 push되어 step/duration을 반영하는지 확인
    await expect(page.getByText('언제 만날까요?')).toBeVisible()
    let url = new URL(page.url())
    expect(url.searchParams.get('step')).toBe('2')
    expect(url.searchParams.get('duration')).toBe('half')

    await page.goBack()

    // 뒤로가기 한 번으로 정확히 직전 단계(1단계)로 복귀하고, 방금 고른 선택값(half)도 유지되어야 한다
    await expect(page.getByText('얼마나 시간을 낼 수 있어요?')).toBeVisible()
    url = new URL(page.url())
    expect(url.searchParams.get('step')).toBe('1')
    expect(url.searchParams.get('duration')).toBe('half')
  })
})
