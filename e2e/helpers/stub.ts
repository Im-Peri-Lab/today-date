import { E2E_STUB_URL } from './env'
import seed from '../stub/seed.json'

/**
 * PostgREST 스텁(e2e/stub/server.mjs)의 control API 클라이언트.
 *
 * 스텁은 Next 서버가 공유하는 단일 프로세스이므로 상태도 공유된다. 그래서
 * DB 를 쓰는 스펙은 반드시 한 파일 안에 모으고(파일 단위로 워커가 나뉜다)
 * playwright.config.ts 의 chromium-db 프로젝트를 fullyParallel: false 로 둔다.
 * 각 테스트는 beforeEach 에서 시나리오를 초기화해 서로의 변경을 물려받지 않는다.
 */

export const refs = seed.refs

export type StubScenario = keyof typeof seed.scenarios

/** 스텁 DB 를 지정 시나리오의 초기 상태로 되돌린다. */
export async function resetStub(scenario: StubScenario = 'twoCouples'): Promise<void> {
  const res = await fetch(`${E2E_STUB_URL}/__control/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  })
  if (!res.ok) throw new Error(`스텁 초기화 실패: ${res.status} ${await res.text()}`)
}

/**
 * 테이블 원본 행을 그대로 읽는다.
 *
 * 응답 코드만 보면 부족하다 — 404 를 주면서 실제로는 행을 지웠을 수도, 200 을
 * 주면서 아무것도 안 바꿨을 수도 있다. 침범 시도 뒤에는 항상 이걸로 DB 최종
 * 상태를 확인한다.
 */
export async function stubRows<T = Record<string, unknown>>(table: string): Promise<T[]> {
  const res = await fetch(`${E2E_STUB_URL}/__control/rows?table=${encodeURIComponent(table)}`)
  if (!res.ok) throw new Error(`스텁 조회 실패: ${res.status} ${await res.text()}`)
  return res.json() as Promise<T[]>
}

export async function stubRowById<T = Record<string, unknown>>(
  table: string,
  id: string
): Promise<T | undefined> {
  const rows = await stubRows<T & { id: string }>(table)
  return rows.find((r) => r.id === id)
}

/**
 * PostgREST DELETE 를 스텁에 직접 날린다 — **하네스 자기 점검용**(앱 경로가 아니다).
 *
 * 계정 삭제 스펙은 "앱이 외래키 순서를 맞게 지운다"를 확인하는데, 그 확인이 의미를
 * 가지려면 스텁이 실제로 잘못된 순서를 거부해야 한다. 스텁의 restrict 대역
 * (§ e2e/stub/server.mjs RESTRICT_REFS)이 살아 있는지 여기로 직접 찔러 확인한다 —
 * 대역이 조용히 없어지면 순서 검증이 통째로 무의미해지기 때문이다.
 */
export async function stubRawDelete(
  table: string,
  query: string
): Promise<{ status: number; code: string | null }> {
  const res = await fetch(`${E2E_STUB_URL}/rest/v1/${table}?${query}`, { method: 'DELETE' })

  // 성공(204)은 본문이 없다 — 그때 code 는 null 이다.
  let code: string | null = null
  try {
    code = ((await res.json()) as { code?: string })?.code ?? null
  } catch {
    code = null
  }

  return { status: res.status, code }
}

/** 앱이 만들 수 없는 행을 심는다(원문을 알고 있는 이메일 인증 토큰 등). */
export async function stubInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${E2E_STUB_URL}/__control/rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, row }),
  })
  if (!res.ok) throw new Error(`스텁 삽입 실패: ${res.status} ${await res.text()}`)
}
