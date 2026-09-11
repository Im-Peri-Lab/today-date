import { NextResponse } from 'next/server'
import { deleteSoloAccount } from '@/lib/auth/accountDeletion'
import { requireCoupleScope } from '@/lib/auth/coupleScope'
import { getSession } from '@/lib/auth/session'
import { PENDING_USER_COOKIE } from '@/lib/auth/pendingUser'

export const dynamic = 'force-dynamic'

/**
 * 계정 삭제 — SOLO 상태의 사용자만 호출할 수 있다.
 *
 * 경로를 /api/auth/* 아래에 두지 않은 이유: 미들웨어의 OPEN_PREFIXES 가 '/api/auth/' 를
 * 세션 없이 통과시킨다(잠금해제·재설정처럼 로그인 전에 불려야 하는 것들 때문이다).
 * 계정 삭제는 정반대로 **반드시 로그인된 요청만** 받아야 하므로 그 접두사를 피해
 * /api/account 에 둔다 — 미들웨어의 세션 검증과 requireCoupleScope 두 겹을 모두 통과해야 한다.
 *
 * 삭제 대상 커플은 세션에서만 온다(requireCoupleScope). 본문을 아예 읽지 않는다 —
 * couple_id 를 받는 순간 남의 계정을 지우는 경로가 생긴다(§ lib/auth/accountDeletion.ts 불변식).
 *
 * PAIRED 차단에 409 를 쓴다(403 이 아니라): 권한이 없어서가 아니라 "지금 상태로는
 * 성립하지 않는 요청"이고, 파트너가 빠지면 같은 요청이 성립한다. 같은 판정을 하는
 * 초대 발송이 already_paired 에 409 를 쓰므로(§ api/auth/invite) 그 쪽과 코드를 맞춘다.
 */
export async function DELETE() {
  try {
    const scope = await requireCoupleScope()
    if (!scope.ok) return scope.response

    const result = await deleteSoloAccount(scope.coupleId)

    if (!result.ok) {
      switch (result.reason) {
        case 'paired':
          return NextResponse.json(
            {
              error:
                '파트너와 연결된 계정은 삭제할 수 없어요. 먼저 파트너 연결을 정리해 주세요.',
            },
            { status: 409 }
          )
        case 'not_found':
          return NextResponse.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404 })
        default:
          // 부분 삭제로 끝났을 수 있다. 계정 행은 마지막에 지우므로 사용자는 여전히
          // 로그인 상태이고 재시도할 수 있다(§ deleteSoloAccount 의 순서 근거) —
          // 그래서 세션을 파기하지 않고 오류만 돌려준다.
          return NextResponse.json(
            { error: '계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.' },
            { status: 500 }
          )
      }
    }

    // ── 삭제 성공 → 세션과 상태 쿠키를 모두 파기한다 ──
    const session = await getSession()
    session.destroy()

    const res = NextResponse.json({ success: true, deleted: result.deleted })

    /*
     * app-ready 를 반드시 지운다 — 이 한 줄이 "같은 이메일로 재가입"의 성립 조건이다.
     *
     * 미들웨어는 app-ready=1 이 있으면 DB 조회를 건너뛰고 "설정 완료"로 단정한다
     * (§ src/middleware.ts). 계정이 사라져 커플이 0개인데 이 쿠키가 남아 있으면
     * 미들웨어는 여전히 설정 완료로 보고 /setup 접근을 홈으로 되돌린다 — 재가입 화면에
     * 들어갈 방법이 없어져 이 기능의 목적 자체가 무너진다.
     */
    res.cookies.delete('app-ready')

    // 초대 수락 직후의 쪽지가 남아 있다면 함께 지운다 — 지워진 커플의 user_id 를
    // 가리키는 쪽지는 아무 의미가 없고, 30분 뒤 만료를 기다릴 이유도 없다.
    res.cookies.delete(PENDING_USER_COOKIE)

    return res
  } catch (err) {
    console.error('[DELETE /api/account]', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
