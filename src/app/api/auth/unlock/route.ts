import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  CoupleRow,
  getCoupleById,
  getCoupleUsers,
  getSoleCouple,
  resolveSessionUser,
} from '@/lib/auth/couple'
import {
  DEVICE_USER_COOKIE,
  DEVICE_USER_MAX_AGE,
  readDeviceUser,
  sealDeviceUser,
} from '@/lib/auth/deviceUser'
import { verifyPasscode } from '@/lib/auth/passcode'
import { PENDING_USER_COOKIE, readPendingUser } from '@/lib/auth/pendingUser'
import { getSession } from '@/lib/auth/session'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 10

const schema = z.object({
  passcode: z.string().min(1),
  /**
   * PAIRED 인데 "누구인지" 단서가 없을 때만 화면이 함께 보낸다(§ app/lock/page.tsx).
   * 평소 로그인에는 없다 — 기기 기억이 그 역할을 하므로 패스코드만으로 끝난다.
   */
  email: z.string().email().optional(),
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
     * 커플을 특정하는 세 경로. 서명된 쿠키 → 없으면 단일 커플.
     *
     * 1) pending-user 쪽지 — 방금 초대를 수락한 사람의 첫 잠금해제(1회용·30분).
     * 2) 기기 기억        — 이 브라우저에서 전에 로그인한 사람(1년, 매 로그인 갱신).
     * 3) 둘 다 없으면     — 잠금 화면은 패스코드만 받으므로 단서가 없다. 커플이 정확히
     *    1개일 때만 진행하고, 그 외에는 403 으로 닫는다.
     *
     * 두 쿠키 모두 세션과 같은 시크릿으로 서명돼 있어, 위조하면 unseal 이 실패해 없는
     * 것과 같이 동작한다. 어느 경로든 패스코드 검증은 동일하게 거친다 — 쿠키는
     * "누구로 발급할지"만 정하고 인증 자체를 대신하지 않는다.
     */
    const pending = await readPendingUser(req.cookies.get(PENDING_USER_COOKIE)?.value)
    const device = await readDeviceUser(req.cookies.get(DEVICE_USER_COOKIE)?.value)

    let couple: CoupleRow | null
    if (pending) {
      couple = await getCoupleById(pending.couple_id)
    } else {
      /**
       * 기기 기억이 커플도 함께 담고 있으므로 getSoleCouple 의 "커플이 정확히 1개일 때만"
       * 제약을 거치지 않고 커플을 확정할 수 있다. 다만 기억은 추측이므로 그 커플이
       * 사라졌다면(다른 기기에서 계정 삭제 후 재가입 등) 실패시키지 않고 폴백한다.
       */
      couple =
        (device ? await getCoupleById(device.couple_id) : null) ?? (await getSoleCouple())
    }

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

    /*
     * 패스코드가 맞았으므로 커플은 확정이다. 남은 문제는 "두 파트너 중 누구인가"로,
     * 단서의 우선순위 판정은 resolveSessionUser 한 곳에 있다(§ lib/auth/couple.ts).
     *
     * 기기 기억은 그 커플의 것일 때만 넘긴다 — 다른 커플의 기억이 남아 있는 기기에서
     * 그 user_id 가 이 커플 사용자 목록에 있을 수는 없지만, 의도를 코드로 못 박아 둔다.
     */
    const users = await getCoupleUsers(couple.id)
    const resolution = resolveSessionUser({
      users,
      pendingUserId: pending?.user_id,
      deviceUserId: device?.couple_id === couple.id ? device.user_id : null,
      email: result.data.email,
    })

    // 패스코드는 맞았으니 실패 카운터는 어느 분기로 가든 초기화한다.
    await supabase
      .from('couples')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('id', couple.id)

    /*
     * 누구인지 모른다 → 세션을 발급하지 않고 이메일을 묻는다.
     *
     * 단서 없이 먼저 만들어진 사용자로 발급하던 예전 동작을 여기서 끊는다. 그때는
     * 초대받은 사람이 재로그인할 때마다 파트너의 세션을 받아, 파트너 화면에서 자기
     * 이메일을 상대로 보게 됐다. 데이터 권한은 두 사람이 동등하므로 이 응답이 막는
     * 것은 권한이 아니라 "내가 누구인지"의 오인이다.
     *
     * 이 응답은 패스코드를 통과한 요청에만 나간다 — 커플에 두 명이 있다는 사실이
     * 패스코드를 모르는 사람에게 새지 않는다.
     */
    if (resolution.kind === 'needsIdentity' || resolution.kind === 'emailMismatch') {
      return NextResponse.json(
        {
          error:
            resolution.kind === 'emailMismatch'
              ? '이 계정에 등록된 이메일이 아니에요.'
              : '함께 쓰는 계정이에요. 이메일로 누구인지 알려주세요.',
          needsEmail: true,
        },
        { status: 409 }
      )
    }

    if (resolution.kind === 'none') {
      console.error('[unlock] 세션에 담을 사용자를 찾지 못했습니다 — couple:', couple.id)
      return NextResponse.json({ error: '앱 설정이 완료되지 않았습니다.' }, { status: 403 })
    }

    const sessionUser = resolution.user

    const session = await getSession()
    session.authenticated = true
    session.lastVerifiedAt = Date.now()
    session.sessionVersion = couple.session_version
    session.user_id = sessionUser.id
    session.couple_id = couple.id
    await session.save()

    const res = NextResponse.json({ success: true })

    // 쪽지는 한 번 쓰고 버린다 — 일회성 사실이므로 남겨둘 이유가 없다.
    // (지속적인 "이 기기의 주인"은 아래 기기 기억이 이어받는다.)
    if (pending) {
      res.cookies.set(PENDING_USER_COOKIE, '', { maxAge: 0, path: '/' })
    }

    /*
     * 이번에 정해진 주체를 기기에 기억시킨다 — 매 로그인마다 갱신해 수명을 되살린다.
     * 그래서 세션(30일)이 만료돼 다시 패스코드를 넣는 평소 재로그인에서는 누구인지를
     * 묻지 않고, 쿠키가 없는 새 기기에서만 한 번 묻는다(§ lib/auth/deviceUser.ts).
     */
    res.cookies.set(
      DEVICE_USER_COOKIE,
      await sealDeviceUser({ user_id: sessionUser.id, couple_id: couple.id }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: DEVICE_USER_MAX_AGE,
        path: '/',
      }
    )

    return res
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
