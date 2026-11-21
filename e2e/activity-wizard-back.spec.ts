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

  test('더블탭 — 전환 직후(첫 탭 후 150~400ms) 들어온 두 번째 탭은 다음 단계 카드를 선택하지 않는다', async ({
    page,
  }) => {
    await page.goto('/recommend/activity')
    await expect(page.getByText('얼마나 시간을 낼 수 있어요?')).toBeVisible()
    const historyBefore = await page.evaluate(() => window.history.length)

    // 실제 탭과 같은 순서(pointerdown → click, detail 1)로 첫 탭 → 250ms 뒤 두 번째 탭.
    // 250ms 시점엔 150ms 자동 전환이 끝나 2단계 카드가 렌더돼 있다 — 두 번째 탭이 그 카드에 떨어진다.
    const secondTapLanded = await page.evaluate(async () => {
      const tap = (el: Element) => {
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true }))
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      }
      const find = (label: string) =>
        Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes(label))
      tap(find('반나절')!)
      await new Promise((r) => setTimeout(r, 250))
      const day = find('주간')
      if (!day) return false
      tap(day)
      return true
    })
    expect(secondTapLanded).toBe(true) // 두 번째 탭이 실제로 2단계 카드에 들어갔는지(테스트 전제)

    // 2단계에 머물고, 주간이 선택되거나 3단계로 넘어가지 않았다
    await page.waitForTimeout(400)
    await expect(page.getByText('언제 만날까요?')).toBeVisible()
    const url = new URL(page.url())
    expect(url.searchParams.get('step')).toBe('2')
    expect(url.searchParams.get('time')).toBeNull()
    expect(await page.evaluate(() => window.history.length)).toBe(historyBefore + 1)
  })

  test('정상 연속 선택 — 각 단계에서 새로 누르면 그대로 다음 단계로 넘어간다', async ({ page }) => {
    await page.goto('/recommend/activity')
    await page.getByRole('button', { name: /반나절/ }).click()
    await expect(page.getByText('언제 만날까요?')).toBeVisible()
    await page.waitForTimeout(350) // 새 질문을 보고 고르는 사람의 최소 간격 수준
    await page.getByRole('button', { name: /주간/ }).click()
    await expect(page.getByText('어디서 즐기고 싶어요?')).toBeVisible()
    expect(new URL(page.url()).searchParams.get('step')).toBe('3')
  })
})
