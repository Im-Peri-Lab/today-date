import type { Page } from '@playwright/test'

/**
 * 패스코드 키패드가 키 입력을 받을 준비가 된 뒤에 숫자를 보낸다.
 *
 * `page.goto` 직후에는 SSR 로 그려진 키패드가 먼저 보이지만, 키보드 리스너는 하이드레이션 뒤에야
 * 붙는다. 그 사이에 `keyboard.type` 을 보내면 입력이 유실돼 잠금해제가 멈춘다(보류 15번).
 * 준비 표지(`data-passcode-ready`, PasscodeInput 의 리스너 등록 뒤 설정)를 기다린 뒤 입력한다.
 */
export async function typePasscode(page: Page, code: string) {
  await page.locator('[data-passcode-ready="true"]').first().waitFor({ state: 'attached' })
  await page.keyboard.type(code)
}
