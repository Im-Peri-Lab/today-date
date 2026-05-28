export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import { getSupabaseClient } from '@/lib/supabase/client'
import { sessionOptions, SessionData } from '@/lib/auth/session'

// /setup, /api/auth/setup/* 는 미설정 상태에서도 접근 가능
const SETUP_PREFIXES = ['/setup', '/api/auth/setup']

// 잠금 화면 관련 경로: 설정 완료 후에도 세션 없이 접근 가능
const OPEN_PREFIXES = ['/lock', '/forgot', '/reset', '/api/auth/']

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

  // setup 완료 여부 확인 (app-ready 쿠키 캐싱)
  const appReadyCookie = req.cookies.get('app-ready')?.value
  let isSetupComplete = appReadyCookie === '1'

  if (!isSetupComplete) {
    // DB에서 직접 확인
    try {
      const supabase = getSupabaseClient()
      const { data: config } = await supabase
        .from('app_config')
        .select('email_verified, passcode_hash')
        .eq('id', 1)
        .single()

      isSetupComplete = !!(config?.email_verified && config?.passcode_hash)
    } catch {
      // DB 접근 실패 시 setup 화면으로
      isSetupComplete = false
    }
  }

  // ── setup 미완료 ──
  if (!isSetupComplete) {
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

    // session_version 검증 (패스코드 리셋 후 세션 무효화)
    if (session.sessionVersion !== undefined) {
      const supabase = getSupabaseClient()
      const { data: config } = await supabase
        .from('app_config')
        .select('session_version')
        .eq('id', 1)
        .single()

      if (config && config.session_version !== session.sessionVersion) {
        const res = pathname.startsWith('/api/')
          ? NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 })
          : NextResponse.redirect(new URL('/lock', req.url))
        res.cookies.delete('today-date-session')
        return res
      }
    }

    return NextResponse.next()
  } catch {
    // 쿠키 복호화 실패 → 세션 만료 처리
    const res = pathname.startsWith('/api/')
      ? NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 })
      : NextResponse.redirect(new URL('/lock', req.url))
    res.cookies.delete('today-date-session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
