import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getCoupleUsers, getSoleCouple, pickSessionUser } from '@/lib/auth/couple'
import { verifyPasscode } from '@/lib/auth/passcode'
import { getSession } from '@/lib/auth/session'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 10

const schema = z.object({
  passcode: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: '패스코드를 입력하세요.' }, { status: 400 })
    }

    const { passcode } = result.data
    const supabase = getSupabaseClient()

    // 잠금 화면은 패스코드만 받으므로 커플을 특정할 단서가 없다 —
    // 커플이 정확히 1개일 때만 진행하고, 그 외에는 403 으로 닫는다.
    // TODO(초대 기능 청크): 커플이 여러 개가 되면 잠금 화면이 이메일을 함께 받아야 한다.
    const couple = await getSoleCouple()

    if (!couple?.passcode_hash) {
      return NextResponse.json({ error: '앱 설정이 완료되지 않았습니다.' }, { status: 403 })
    }

    // 잠금 확인
    if (couple.locked_until && new Date(couple.locked_until) > new Date()) {
      return NextResponse.json(
        { error: '잠시 후 다시 시도하세요.', locked: true, lockedUntil: couple.locked_until },
        { status: 423 }
      )
    }

    const isCorrect = await verifyPasscode(passcode, couple.passcode_hash)

    if (!isCorrect) {
      const newAttempts = (couple.failed_attempts ?? 0) + 1
      const shouldLock = newAttempts >= MAX_ATTEMPTS
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
        : null

      await supabase
        .from('couples')
        .update({ failed_attempts: newAttempts, locked_until: lockedUntil })
        .eq('id', couple.id)

      return NextResponse.json(
        {
          error: shouldLock
            ? `${LOCK_MINUTES}분간 잠깁니다.`
            : `패스코드가 틀렸습니다. (${MAX_ATTEMPTS - newAttempts}회 남음)`,
          locked: shouldLock,
          lockedUntil,
          remainingAttempts: Math.max(0, MAX_ATTEMPTS - newAttempts),
        },
        { status: 401 }
      )
    }

    // 성공 — 세션에 담을 사용자를 정한다. 패스코드가 맞았으므로 커플은 확정이지만,
    // 사용자 행이 없으면 user_id 를 채울 수 없어 세션을 발급하지 않는다(데이터 이상).
    const users = await getCoupleUsers(couple.id)
    const sessionUser = pickSessionUser(users)

    if (!sessionUser) {
      console.error('[unlock] 인증된 사용자 행이 없습니다 — couple:', couple.id)
      return NextResponse.json({ error: '앱 설정이 완료되지 않았습니다.' }, { status: 403 })
    }

    await supabase
      .from('couples')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('id', couple.id)

    const session = await getSession()
    session.authenticated = true
    session.lastVerifiedAt = Date.now()
    session.sessionVersion = couple.session_version
    session.user_id = sessionUser.id
    session.couple_id = couple.id
    await session.save()

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
