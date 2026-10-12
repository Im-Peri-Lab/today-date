import { test, expect, type Page } from '@playwright/test'
import { coupleSessionCookies } from './helpers/auth'
import { refs } from './helpers/stub'

/**
 * 상세 인라인 편집(`/places/[id]`, `/activities/[id]`)의 저장/취소 영역 회귀.
 *
 * "저장 중" 상태에서 취소 버튼 잔상이 겹쳐 보이던 문제(iOS) 방지. 저장 요청을 지연시켜 저장 중
 * 상태를 유지하고, 클릭 직후부터 매 프레임(rAF) 두 버튼의 위치·진행 중인 애니메이션 수·취소 버튼
 * 개수/노드 동일성을 기록해 아래를 확인한다.
 *  - 취소 버튼은 DOM 에 항상 1개이고 같은 노드다(언마운트·key 변경 없음).
 *  - 저장 중에 두 버튼 자체에 걸린 CSS transition/animation 이 없다(스피너 회전은 자식이라 제외).
 *  - 첫 저장 중 프레임부터 취소 버튼이 최종 x 에 있다(중간 프레임 없음 = 한 번에 밀림).
 *  - 우측 정렬, 시각 순서 = 취소 → 저장.
 */

type Sample = {
  cancelCount: number
  sameCancelNode: boolean
  cancelX: number
  cancelRight: number
  saveX: number
  saveRight: number
  cancelAnims: number
  saveOwnAnims: number
  saving: boolean
}

const SAVE_DELAY_MS = 1500

const TARGETS = [
  { name: '/places/[id]', path: `/places/${refs.plcA1}`, api: '**/api/places/*' },
  { name: '/activities/[id]', path: `/activities/${refs.actA1}`, api: '**/api/activities/*' },
]

const VIEWPORTS = [
  { name: 'mobile390', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
]

const SCHEMES = ['light', 'dark'] as const

async function startSampling(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __samples: unknown[]; __stop: boolean }
    w.__samples = []
    w.__stop = false
    const buttons = () => Array.from(document.querySelectorAll('button'))
    const cancelsNow = () => buttons().filter((b) => b.textContent?.trim() === '취소')
    const saveNow = () => buttons().find((b) => b.textContent?.trim() === '저장')
    ;(cancelsNow()[0] as HTMLElement & { __orig?: boolean }).__orig = true
    const tick = () => {
      const cancels = cancelsNow()
      const c = cancels[0] as (HTMLElement & { __orig?: boolean }) | undefined
      const s = saveNow()
      if (c && s) {
        const cr = c.getBoundingClientRect()
        const sr = s.getBoundingClientRect()
        w.__samples.push({
          cancelCount: cancels.length,
          sameCancelNode: !!c.__orig,
          cancelX: Math.round(cr.x * 10) / 10,
          cancelRight: Math.round(cr.right * 10) / 10,
          saveX: Math.round(sr.x * 10) / 10,
          saveRight: Math.round(sr.right * 10) / 10,
          cancelAnims: c.getAnimations({ subtree: true }).length,
          // 스피너(자식) 회전은 제외 — 버튼 요소 자체의 transition/animation 만 센다.
          saveOwnAnims: s.getAnimations({ subtree: false }).length,
          saving: !!s.querySelector('.animate-spin'),
        })
      }
      if (!w.__stop) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

async function stopSampling(page: Page): Promise<Sample[]> {
  return (await page.evaluate(() => {
    const w = window as unknown as { __samples: unknown[]; __stop: boolean }
    w.__stop = true
    return w.__samples
  })) as Sample[]
}

async function openInlineEdit(page: Page, target: (typeof TARGETS)[number]) {
  await page.route(target.api, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue()
    await new Promise((r) => setTimeout(r, SAVE_DELAY_MS))
    await route.continue()
  })
  await page.goto(target.path)
  await page.getByRole('button', { name: '등록 정보 수정' }).click()
  const save = page.getByRole('button', { name: '저장', exact: true })
  await expect(save).toBeVisible()
  await page.waitForTimeout(300)
  return save
}

for (const target of TARGETS) {
  test(`저장 중 취소 버튼 — 잔상 없이 한 번에 이동 (${target.name})`, async ({ context, page }) => {
    await context.addCookies(
      await coupleSessionCookies({ coupleId: refs.coupleA, userId: refs.userA })
    )
    const save = await openInlineEdit(page, target)

    await startSampling(page)
    await page.waitForTimeout(100) // 저장 전(정지) 기준 샘플
    await save.click()
    await expect(save.locator('.animate-spin')).toBeVisible()
    await page.waitForTimeout(SAVE_DELAY_MS - 600)

    const samples = await stopSampling(page)
    const idle = samples.filter((s) => !s.saving)
    const busy = samples.filter((s) => s.saving)
    expect(idle.length).toBeGreaterThan(0)
    expect(busy.length).toBeGreaterThan(5)

    // 우측 정렬 + 시각 순서 취소 → 저장 (저장이 우측 끝, 취소는 저장 바로 왼쪽에 인접)
    for (const s of samples) {
      expect(s.cancelRight).toBeLessThanOrEqual(s.saveX)
      expect(s.saveX - s.cancelRight).toBeLessThanOrEqual(8.5) // gap-2 = 8px
    }
    expect(new Set(samples.map((s) => s.saveRight)).size).toBe(1) // 우측 끝 고정

    // 취소 버튼은 DOM 에 항상 1개, 같은 노드(리마운트 없음)
    expect(samples.every((s) => s.cancelCount === 1)).toBe(true)
    expect(samples.every((s) => s.sameCancelNode)).toBe(true)

    // 저장 중 두 버튼에 transition/animation 없음
    expect(Math.max(...busy.map((s) => s.cancelAnims))).toBe(0)
    expect(Math.max(...busy.map((s) => s.saveOwnAnims))).toBe(0)

    // 첫 저장 중 프레임부터 최종 x — 중간 프레임 없음
    const finalX = busy[busy.length - 1].cancelX
    expect(busy[0].cancelX).toBe(finalX)
    expect(busy.every((s) => s.cancelX === finalX)).toBe(true)
    // 스피너 병기분만큼만 밀린다(저장 버튼 폭 증가 = 스피너 16 + gap 6)
    expect(idle[0].cancelX - finalX).toBeGreaterThan(0)
    expect(idle[0].cancelX - finalX).toBeLessThan(30)
  })
}

for (const vp of VIEWPORTS) {
  for (const scheme of SCHEMES) {
    test(`저장 전/저장 중 스크린샷 — ${vp.name} ${scheme}`, async ({ context, page }, testInfo) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: scheme })
      await context.addCookies(
        await coupleSessionCookies({ coupleId: refs.coupleA, userId: refs.userA })
      )
      const save = await openInlineEdit(page, TARGETS[0])
      const actions = save.locator('xpath=..')

      await actions.screenshot({ path: testInfo.outputPath(`${vp.name}-${scheme}-idle.png`) })
      await save.click()
      await expect(save.locator('.animate-spin')).toBeVisible()
      await page.waitForTimeout(250) // 전환 직후 안정화
      await actions.screenshot({ path: testInfo.outputPath(`${vp.name}-${scheme}-saving.png`) })
      await page.screenshot({ path: testInfo.outputPath(`${vp.name}-${scheme}-saving-full.png`) })
    })
  }
}
