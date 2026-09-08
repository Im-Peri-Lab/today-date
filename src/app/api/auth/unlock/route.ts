import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  getCoupleById,
  getCoupleUsers,
  getSoleCouple,
  pickSessionUser,
} from '@/lib/auth/couple'
import { verifyPasscode } from '@/lib/auth/passcode'
import { PENDING_USER_COOKIE, readPendingUser } from '@/lib/auth/pendingUser'
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

    /**
     * 커플을 특정하는 두 경로.
     *
     * 1) pending-user 쿠키가 있으면 — 방금 초대를 수락한 사람의 첫 잠금해제다.
     *    쿠키가 couple_id 와 user_id 를 담고 있으므로 커플이 확정되고, 세션 주체도
     *    "먼저 만들어진 사용자"가 아니라 방금 합류한 그 사람이 된다. 쿠키는 세션과
     *    같은 시크릿으로 서명돼 있어 위조하면 unseal 이 실패해 아래 2)로 내려간다.
     * 2) 쿠키가 없으면 — 잠금 화면은 패스코드만 받으므로 커플을 특정할 단서가 없다.
     *    커플이 정확히 1개일 때만 진행하고, 그 외에는 403 으로 닫는다.
     *
     * 어느 경로든 패스코드 검증은 동일하게 거친다 — 쿠키는 "누구로 발급할지"만 정하고
     * 인증 자체를 대신하지 않는다.
     */
    const pending = await readPendingUser(req.cookies.get(PENDING_USER_COOKIE)?.value)
    const couple = pending
      ? await getCoupleById(pending.couple_id)
      : await getSoleCouple()

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
    //
    // pending-user 쿠키가 지목한 사용자는 그 커플에 실제로 있고 인증된 상태여야 한다.
    // 쿠키가 가리키는 행이 사라졌다면 그 쪽지는 무효이므로 일반 선택으로 되돌리지 않고
    // 실패시킨다 — 초대받은 사람이 조용히 파트너의 세션을 받는 일이 없어야 한다.
    const users = await getCoupleUsers(couple.id)
    const sessionUser = pending
      ? users.find((u) => u.id === pending.user_id && u.email_verified) ?? null
      : pickSessionUser(users)

    if (!sessionUser) {
      console.error('[unlock] 세션에 담을 사용자를 찾지 못했습니다 — couple:', couple.id)
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

    // 쪽지는 한 번 쓰고 버린다 — 남겨두면 이후 재로그인이 계속 이 user_id 로 고정된다.
    const res = NextResponse.json({ success: true })
    if (pending) {
      res.cookies.set(PENDING_USER_COOKIE, '', { maxAge: 0, path: '/' })
    }

    return res
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
