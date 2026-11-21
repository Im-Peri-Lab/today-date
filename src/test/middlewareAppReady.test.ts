// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { sealData } from 'iron-session'

/**
 * 미들웨어의 app-ready 게이트 — 이번 변경이 지켜야 할 세 가지.
 *   1. app-ready=1 이 있으면 워크스페이스 DB 조회(getWorkspaceStatus)를 하지 않는다.
 *   2. 없으면 기존처럼 DB 로 판정하고, 미설정(NONE/SOLO)이면 /setup 으로 보낸다.
 *   3. 세션을 믿을 수 없어 만료 처리할 때 app-ready 도 지운다
 *      — 다른 기기에서 계정을 지운 뒤 이 기기에서 /setup(재가입)에 들어갈 수 있어야 한다.
 */

const getWorkspaceStatus = vi.fn()

vi.mock('@/lib/auth/couple', () => ({
  getWorkspaceStatus: () => getWorkspaceStatus(),
}))
vi.mock('@/lib/auth/sessionVersionCache', () => ({
  isSessionVersionCurrent: async () => true,
}))
const PASSWORD = 'x'.repeat(32)
vi.mock('@/lib/auth/session', () => ({
  sessionOptions: { password: 'x'.repeat(32) },
}))

import { middleware } from '@/middleware'

function req(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  return new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} })
}

/** 응답의 Set-Cookie 목록 — getSetCookie 가 비면 합쳐진 헤더로 폴백(§ accountDeleteRoute.test.ts). */
function setCookies(res: Response): string[] {
  const list = res.headers.getSetCookie()
  if (list.length) return list
  return (res.headers.get('set-cookie') ?? '').split(/,\s*(?=[^;=]+=)/).filter(Boolean)
}

beforeEach(() => {
  getWorkspaceStatus.mockReset()
})

describe('middleware app-ready 게이트', () => {
  it('app-ready=1 이면 워크스페이스 조회를 하지 않는다', async () => {
    await middleware(req('/lock', { 'app-ready': '1' }))
    expect(getWorkspaceStatus).not.toHaveBeenCalled()
  })

  it('app-ready 가 없으면 DB 로 판정하고, 미설정이면 /setup 으로 보낸다', async () => {
    getWorkspaceStatus.mockResolvedValue({ state: 'SOLO', setupComplete: false })
    const res = await middleware(req('/'))
    expect(getWorkspaceStatus).toHaveBeenCalledTimes(1)
    expect(res.headers.get('location')).toBe('http://localhost/setup')
  })

  it('app-ready 가 없고 커플이 없으면(NONE) /setup 은 그대로 열린다', async () => {
    getWorkspaceStatus.mockResolvedValue({ state: 'NONE', setupComplete: false })
    const res = await middleware(req('/setup'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('세션 만료 처리 시 app-ready 도 지운다', async () => {
    // couple_id 없는 인증 세션(전환 이전 쿠키) → expireSession
    const sealed = await sealData({ authenticated: true }, { password: PASSWORD })
    const res = await middleware(req('/', { 'app-ready': '1', 'today-date-session': sealed }))
    expect(res.headers.get('location')).toBe('http://localhost/lock')
    const cookies = setCookies(res)
    expect(cookies.some((c) => /^today-date-session=;/.test(c))).toBe(true)
    expect(cookies.some((c) => /^app-ready=;/.test(c))).toBe(true)
  })
})
