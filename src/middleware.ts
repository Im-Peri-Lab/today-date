export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import { getCoupleById, getWorkspaceStatus, WorkspaceState } from '@/lib/auth/couple'
import { sessionOptions, SessionData } from '@/lib/auth/session'

// /setup, /api/auth/setup/* 는 미설정 상태에서도 접근 가능
const SETUP_PREFIXES = ['/setup', '/api/auth/setup']

// 잠금 화면 관련 경로: 설정 완료 후에도 세션 없이 접근 가능
//
// /invite 는 파트너 초대 링크(/invite?token=...)다. 초대받은 사람은 아직 users 행도
// 세션도 없으므로 반드시 인증 전에 열려야 한다. 토큰 검증과 수락 처리는 그 라우트
// 핸들러가 직접 한다(src/app/invite/route.ts) — 미들웨어는 통과만 시킨다.
const OPEN_PREFIXES = ['/lock', '/forgot', '/reset', '/invite', '/api/auth/']

/** 세션을 신뢰할 수 없을 때: API 는 401, 화면은 /lock 으로 보내고 쿠키를 지운다. */
function expireSession(req: NextRequest, pathname: string, message: string) {
  const res = pathname.startsWith('/api/')
    ? NextResponse.json({ error: message }, { status: 401 })
    : NextResponse.redirect(new URL('/lock', req.url))
  res.cookies.delete('today-date-session')
  return res
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 정적 파일 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 워크스페이스 상태 확인 (app-ready 쿠키 캐싱 — 있으면 DB 조회를 건너뛴다)
  const appReadyCookie = req.cookies.get('app-ready')?.value
  let isSetupComplete = appReadyCookie === '1'
  let state: WorkspaceState | null = null

  if (!isSetupComplete) {
    // couples/users 에서 직접 확인 (app_config 는 더 이상 읽지 않는다)
    try {
      const status = await getWorkspaceStatus()
      state = status.state
      isSetupComplete = status.setupComplete
    } catch {
      // DB 접근 실패 시 setup 화면으로
      state = null
      isSetupComplete = false
    }
  }

  // ── setup 미완료 ──
  if (!isSetupComplete) {
    // 여기서 관측되는 상태는 NONE(커플 자체가 없음) 또는
    // SOLO(커플과 본인 행은 있으나 이메일 미인증 또는 패스코드 미설정)뿐이다.
    // PAIRED 는 초대가 성립한 뒤에만 도달하므로 설정 미완료로 관측될 수 없다 —
    // 관측됐다면 couples/users 데이터가 어긋난 것이므로 흔적을 남긴다.
    if (state === 'PAIRED') {
      console.warn('[middleware] PAIRED 상태인데 설정이 미완료입니다 — couples/users 데이터 점검 필요')
    }

    const isAllowed = SETUP_PREFIXES.some((p) => pathname.startsWith(p))
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/setup', req.url))
    }
    return NextResponse.next()
  }

  // ── setup 완료 ──

  // /setup 접근 차단 → 홈으로
  if (pathname.startsWith('/setup')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // 잠금/인증 관련 경로는 세션 없이도 통과
  if (OPEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 보호 경로: 세션 검증
  //
  // SOLO 와 PAIRED 를 여기서 구분하지 않는다 — 인증 상태(패스코드·잠금·session_version)는
  // 커플 단위이고 데이터도 커플 단위로 공유되므로, 세션이 유효하면 두 파트너는 완전히
  // 동등하다. 파트너를 구분해야 하는 유일한 지점은 초대 수락 직후의 첫 세션 발급이며,
  // 그건 미들웨어가 아니라 /api/auth/unlock 이 pending-user 쿠키로 처리한다.
  const rawCookie = req.cookies.get('today-date-session')?.value

  if (!rawCookie) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      : NextResponse.redirect(new URL('/lock', req.url))
  }

  try {
    const session = await unsealData<SessionData>(rawCookie, {
      password: sessionOptions.password as string,
    })

    if (!session.authenticated) {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
        : NextResponse.redirect(new URL('/lock', req.url))
    }

    // couple_id 없는 세션은 app_config 시절에 발급된 쿠키다. 어느 커플의 인증 상태로
    // 검증해야 할지 알 수 없으므로 통과시키지 않고 만료로 처리한다(재로그인 1회 필요).
    if (!session.couple_id) {
      return expireSession(req, pathname, '세션이 만료되었습니다.')
    }

    // session_version 검증 (패스코드 리셋 후 세션 무효화)
    if (session.sessionVersion !== undefined) {
      try {
        const couple = await getCoupleById(session.couple_id)

        // 커플 행이 사라졌으면 그 세션도 무효다.
        if (!couple || couple.session_version !== session.sessionVersion) {
          return expireSession(req, pathname, '세션이 만료되었습니다.')
        }
      } catch {
        // 조회 자체가 실패한 것은 세션이 무효라는 근거가 아니다 —
        // 일시적 DB 장애로 로그인된 기기가 전부 튕기지 않도록 통과시킨다(전환 이전과 동일).
      }
    }

    return NextResponse.next()
  } catch {
    // 쿠키 복호화 실패 → 세션 만료 처리
    return expireSession(req, pathname, '세션이 만료되었습니다.')
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
