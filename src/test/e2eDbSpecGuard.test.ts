import { describe, expect, it } from 'vitest'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * e2e/db 스펙 파일 수 가드.
 *
 * `chromium-db` 프로젝트는 `fullyParallel: false` 로 한 파일 안의 순서만 지킨다. 워커는 전역 설정이라
 * 파일이 둘 이상이면 서로 다른 워커에서 동시에 돌고, 공유 스텁 상태를 상대 스펙의 beforeEach 가
 * 갈아엎는다(playwright.config.ts 주석, 2026-11-13 CI 실패). 그래서 DB 스텁 스펙은 한 파일에만 둔다.
 *
 * 이 테스트는 `npm test`(CI 의 Unit Test 단계, lint 다음)에서 돌아, 두 번째 파일이 추가되는 PR 을
 * 실패시킨다. Playwright 설정 로드 시점 검사 대신 단위 테스트를 고른 이유: 설정 로드는 E2E 를 돌릴
 * 때만 실행되어 CI 의 Unit Test 단계에서는 잡히지 않고, 설정 파일에 파일 시스템 검사를 넣으면 설정이
 * 실행 환경에 묶인다.
 */
const dbSpecDir = resolve(process.cwd(), 'e2e/db') // npm 스크립트는 저장소 루트에서 실행된다

describe('e2e/db 스펙 가드', () => {
  it('DB 스텁 스펙은 한 파일(e2e/db/isolation.spec.ts)에만 둔다', () => {
    const specs = readdirSync(dbSpecDir).filter((name) => name.endsWith('.spec.ts'))

    expect(
      specs,
      'e2e/db 스펙이 둘 이상이면 chromium-db 워커가 갈라져 스텁 상태가 섞인다. 기존 파일에 test 를 추가하라.',
    ).toHaveLength(1)
  })
})
