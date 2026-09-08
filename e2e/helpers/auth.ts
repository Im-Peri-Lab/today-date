import { sealData, unsealData } from 'iron-session'
import type { Page } from '@playwright/test'
import { E2E_BASE_URL, E2E_SESSION_SECRET } from './env'

/**
 * 실제 패스코드 로그인(/api/auth/unlock)은 커플이 정확히 1개일 때만 통과한다
 * (getSoleCouple — 잠금 화면이 이메일을 받지 않아 커플을 특정할 단서가 없다).
 * 그래서 커플이 2개인 격리 시나리오에서는 패스코드 로그인으로 "A 로 로그인"을 만들 수 없다.
 * middleware.ts/getSession()이 읽는 today-date-session 쿠키를 iron-session 의 sealData 로
 * 직접 발급해 주입한다 — 서버가 신뢰하는 것과 완전히 동일한 쿠키다.
 *
 * app-ready 쿠키는 middleware 가 "설정 완료 여부"를 DB 조회 없이 판단하는 캐시다.
 */

// DB(스텁)에 존재하지 않아도 되는 고정 더미 uuid — 아래 authCookies() 전용.
const E2E_COUPLE_ID = '00000000-0000-4000-8000-000000000001'
const E2E_USER_ID = '00000000-0000-4000-8000-000000000002'

type Cookie = {
  name: string
  value: string
  domain: string
  path: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'Lax'
}

function cookie(name: string, value: string, httpOnly = true): Cookie {
  return {
    name,
    value,
    domain: new URL(E2E_BASE_URL).hostname,
    path: '/',
    httpOnly,
    secure: false,
    sameSite: 'Lax',
  }
}

async function seal(data: Record<string, unknown>): Promise<string> {
  return sealData(data, { password: E2E_SESSION_SECRET })
}

/**
 * DB 를 타지 않는 위저드 E2E 용 세션 (API 를 브라우저에서 mocking 하는 스펙들).
 *
 * sessionVersion 을 의도적으로 생략한다: middleware 는 sessionVersion 이 undefined 가
 * 아닐 때만 couple_id 로 couples.session_version 을 비교 조회하므로, 생략하면 그 조회
 * 자체가 필요 없어진다. app-ready 까지 넣어 DB 접근이 0회가 된다 — 그래서 이 쿠키의
 * couple_id 는 스텁에 없는 더미여도 된다.
 */
export async function authCookies() {
  const sealed = await seal({
    authenticated: true,
    lastVerifiedAt: Date.now(),
    couple_id: E2E_COUPLE_ID,
    user_id: E2E_USER_ID,
  })

  return [cookie('today-date-session', sealed), cookie('app-ready', '1', false)]
}

/**
 * 스텁 DB 에 실제로 존재하는 커플로 로그인한 세션.
 *
 * authCookies() 와 달리 sessionVersion 을 담는다 — middleware 가 couple_id 로
 * couples.session_version 을 조회해 비교하는 경로를 실제로 태우기 위함이다.
 * 세션 검증까지 스텁 DB 를 거치므로 "로그인 상태"가 서버 관점에서 진짜다.
 */
export async function coupleSessionCookies(opts: {
  coupleId: string
  userId: string
  sessionVersion?: number
}) {
  const sealed = await seal({
    authenticated: true,
    lastVerifiedAt: Date.now(),
    sessionVersion: opts.sessionVersion ?? 1,
    couple_id: opts.coupleId,
    user_id: opts.userId,
  })

  return [cookie('today-date-session', sealed), cookie('app-ready', '1', false)]
}

/**
 * couple_id 가 없는 세션 — app_config 시절(전환 이전)에 발급된 쿠키를 재현한다.
 * middleware 는 어느 커플의 인증 상태로 검증해야 할지 알 수 없으므로 만료 처리해야 한다.
 */
export async function legacySessionCookies() {
  const sealed = await seal({
    authenticated: true,
    lastVerifiedAt: Date.now(),
    user_id: E2E_USER_ID,
  })

  return [cookie('today-date-session', sealed), cookie('app-ready', '1', false)]
}

/**
 * 서버가 실제로 발급한 세션 쿠키를 열어 본다.
 *
 * "패스코드 로그인 뒤 세션이 누구로 발급됐는가"는 화면으로는 확인할 수 없다 — 커플
 * 데이터는 두 파트너가 똑같이 보이므로 화면이 같다. 초대 수락 직후의 첫 잠금해제가
 * 먼저 만들어진 사용자가 아니라 방금 합류한 사용자로 발급되는지는 쿠키의 user_id 를
 * 직접 봐야 판별된다. 서버와 같은 시크릿으로 unseal 하므로 서버가 읽는 것과 동일한 값이다.
 *
 * 쿠키가 없으면 null(로그아웃 상태), 복호화가 실패하면 예외를 그대로 낸다 —
 * 조용히 null 이 되면 "세션이 없다"와 구분할 수 없다.
 */
export async function readSessionCookie(page: Page): Promise<{
  authenticated?: boolean
  user_id?: string
  couple_id?: string
  sessionVersion?: number
} | null> {
  const cookies = await page.context().cookies()
  const raw = cookies.find((c) => c.name === 'today-date-session')?.value
  if (!raw) return null

  return unsealData(raw, { password: E2E_SESSION_SECRET })
}
