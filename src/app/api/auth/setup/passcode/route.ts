import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getCoupleUsers, getSoleCouple, pickSessionUser } from '@/lib/auth/couple'
import { hashPasscode } from '@/lib/auth/passcode'
import {
  DEVICE_USER_COOKIE,
  DEVICE_USER_MAX_AGE,
  sealDeviceUser,
} from '@/lib/auth/deviceUser'
import { getSession } from '@/lib/auth/session'

const schema = z.object({
  passcode: z
    .string()
    .min(6, '6자리를 입력하세요.')
    .max(6, '6자리를 입력하세요.')
    .regex(/^\d+$/, '숫자만 입력하세요.'),
})

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30일

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { passcode } = result.data
    const supabase = getSupabaseClient()

    // 최초 설정 중이므로 커플은 1개뿐이다(send-verify 가 만든 그 커플).
    const couple = await getSoleCouple()
    if (!couple) {
      return NextResponse.json({ error: '이메일 인증이 필요합니다.' }, { status: 403 })
    }

    const users = await getCoupleUsers(couple.id)
    const verifiedUser = pickSessionUser(users)

    if (!verifiedUser) {
      return NextResponse.json({ error: '이메일 인증이 필요합니다.' }, { status: 403 })
    }

    if (couple.passcode_hash) {
      return NextResponse.json({ error: '이미 패스코드가 설정되어 있습니다.' }, { status: 409 })
    }

    const hash = await hashPasscode(passcode)
    const { error: updateError } = await supabase
      .from('couples')
      .update({ passcode_hash: hash })
      .eq('id', couple.id)

    if (updateError) {
      console.error('[setup/passcode] couple 갱신 실패:', updateError)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
    }

    // 세션 발급 (iron-session이 Set-Cookie 헤더를 내부적으로 처리)
    const session = await getSession()
    session.authenticated = true
    session.lastVerifiedAt = Date.now()
    session.sessionVersion = couple.session_version
    session.user_id = verifiedUser.id
    session.couple_id = couple.id
    await session.save()

    const res = NextResponse.json({ success: true })

    /*
     * 최초 설정도 "이 기기는 이 사람"이 확정되는 지점이므로 기기 기억을 심는다.
     * 나중에 파트너를 초대해 PAIRED 가 되어도, 이 기기는 계속 설정한 사람으로 남는다
     * — 그래야 초대자가 재로그인할 때 누구인지 다시 묻지 않는다(§ lib/auth/deviceUser.ts).
     */
    res.cookies.set(
      DEVICE_USER_COOKIE,
      await sealDeviceUser({ user_id: verifiedUser.id, couple_id: couple.id }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: DEVICE_USER_MAX_AGE,
        path: '/',
      }
    )

    // app-ready 쿠키도 응답에 추가
    res.cookies.set('app-ready', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return res
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
