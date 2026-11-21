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

  test('선택 카드 연타 — 전환 대기(약 150ms) 중 다른 카드를 눌러도 단계는 한 번만 넘어가고 첫 선택이 유지된다', async ({
    page,
  }) => {
    await page.goto('/recommend/activity')
    await expect(page.getByText('얼마나 시간을 낼 수 있어요?')).toBeVisible()

    const historyBefore = await page.evaluate(() => window.history.length)

    // 전환 대기 창 안에 확실히 들어가도록 같은 틱에서 연달아 누른다: 반나절 → 하루 → 하루
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const pick = (label: string) => buttons.find((b) => b.textContent?.includes(label))!
      pick('반나절').click()
      pick('하루').click()
      pick('하루').click()
    })

    await expect(page.getByText('언제 만날까요?')).toBeVisible()
    let url = new URL(page.url())
    expect(url.searchParams.get('step')).toBe('2')
    expect(url.searchParams.get('duration')).toBe('half')

    // 전환이 한 번만 일어났는지 — 히스토리 엔트리가 정확히 하나만 늘었다(대기 중 전환이 더 실행되지 않음)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => window.history.length)).toBe(historyBefore + 1)
    expect(new URL(page.url()).searchParams.get('duration')).toBe('half')

    // 뒤로가기 한 번이면 1단계, 방금 고른 값(half) 유지
    await page.goBack()
    await expect(page.getByText('얼마나 시간을 낼 수 있어요?')).toBeVisible()
    url = new URL(page.url())
    expect(url.searchParams.get('step')).toBe('1')
    expect(url.searchParams.get('duration')).toBe('half')
  })
})
