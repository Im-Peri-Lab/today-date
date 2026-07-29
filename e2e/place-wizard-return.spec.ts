import { test, expect } from '@playwright/test'
import { authCookies } from './helpers/auth'
import { mockPlaceCategories, mockPlaceRecommend, PLACE_TITLE } from './helpers/mocks'

/**
 * 실제 상세 화면(/places/[id])은 서버 컴포넌트에서 Supabase를 직접 조회하므로 DB 없이는
 * 안정적으로 자동화할 수 없다(요청 명세의 스코프 결정 사항). 대신 이 테스트는 DB 의존 없이도
 * 검증 가능한 두 가지 — (1) 결과 카드의 returnTo가 정확히 현재 결과 화면 URL을 가리키는지,
 * (2) 그 URL로 재진입(새 마운트)했을 때 재조회 없이 sessionStorage 캐시로 동일한 결과가
 * 복원되는지 — 를 자동화한다. 실제 상세 화면 왕복(카드 → 상세 → "추천 결과로" 복귀)은
 * 기존 아이폰 실기기 수동 검증으로 남는다.
 */
test.describe('다이닝 추천 위저드 — 결과 화면 복귀', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies(await authCookies())
    await mockPlaceCategories(page)
  })

  test('조건 선택 → 결과 화면의 returnTo가 정확하고, 같은 URL 재진입 시 캐시로 결과·조건이 복원된다', async ({
    page,
  }) => {
    await mockPlaceRecommend(page)

    await page.goto('/recommend/place')

    await page.getByRole('button', { name: /점심/ }).click()
    await expect(page.getByPlaceholder('예: 마포, 강남, 성수동')).toBeVisible()
    await page.getByPlaceholder('예: 마포, 강남, 성수동').fill('망원동')
    await page.getByRole('button', { name: '다음', exact: true }).click()

    await expect(page.getByText('카테고리를 골라볼까요?')).toBeVisible()
    await page.getByRole('button', { name: '추천 받기' }).click()

    // 결과 화면 진입 확인 — 첫 조회이므로 call 1
    const firstCard = page.getByText(`${PLACE_TITLE} (call 1)`)
    await expect(firstCard).toBeVisible()

    const resultUrl = new URL(page.url())
    expect(resultUrl.searchParams.get('step')).toBe('result')
    expect(resultUrl.searchParams.get('meal')).toBe('lunch')
    expect(resultUrl.searchParams.get('area')).toBe('망원동')

    // 카드의 returnTo가 정확히 지금 이 결과 화면(선택 조건 포함) URL을 가리키는지 확인
    const cardLink = page.locator('a').filter({ hasText: `${PLACE_TITLE} (call 1)` })
    const href = await cardLink.getAttribute('href')
    expect(href).toBeTruthy()
    const detailUrl = new URL(href!, page.url())
    const returnTo = detailUrl.searchParams.get('returnTo')
    expect(returnTo).toBe(`${resultUrl.pathname}${resultUrl.search}`)

    // 상세 화면 진입 후 "추천 결과로" 복귀를 흉내: 동일한 결과 URL로 재진입(컴포넌트 재마운트)했을 때
    // 재조회(call 2) 없이 sessionStorage 캐시로 정확히 같은(call 1) 결과가 복원되어야 한다.
    await page.goto(returnTo!)

    await expect(page.getByText(`${PLACE_TITLE} (call 1)`)).toBeVisible()
    await expect(page.getByText(`${PLACE_TITLE} (call 2)`)).not.toBeVisible()

    const restoredUrl = new URL(page.url())
    expect(restoredUrl.searchParams.get('meal')).toBe('lunch')
    expect(restoredUrl.searchParams.get('area')).toBe('망원동')
  })
})
