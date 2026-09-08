import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCoupleScope } from '@/lib/auth/coupleScope'
import { sendPartnerInvite } from '@/lib/auth/invite'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요.'),
})

/**
 * 파트너 초대 발송 — SOLO 상태의 사용자만 호출할 수 있다.
 *
 * 커플은 세션에서 온다(requireCoupleScope) — 본문의 couple_id 같은 값은 읽지 않는다.
 * 남의 커플에 파트너를 끼워 넣는 경로를 만들지 않기 위함이다.
 *
 * 오류 문구는 여기서 결정한다. 도메인 계층(lib/auth/invite.ts)은 사유 코드만 돌려주고,
 * 화면(리다이렉트 안내)과 API(JSON)가 같은 사유를 각자의 형태로 표현한다.
 *
 * 사용자 열거 방지를 적용하지 않는 유일한 인증 경로다: "이미 가입된 이메일입니다"를
 * 그대로 알려준다. 이 API 는 로그인한 사용자만 호출할 수 있고, 초대가 조용히 실패하면
 * 파트너가 메일을 못 받은 이유를 알 방법이 없어 제품이 고장난 것처럼 보인다.
 */
export async function POST(req: NextRequest) {
  try {
    const scope = await requireCoupleScope()
    if (!scope.ok) return scope.response

    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: '올바른 이메일 주소를 입력하세요.' }, { status: 400 })
    }

    const invite = await sendPartnerInvite({
      coupleId: scope.coupleId,
      targetEmail: result.data.email,
    })

    if (!invite.ok) {
      switch (invite.reason) {
        case 'already_registered':
          return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 })
        case 'already_paired':
          return NextResponse.json(
            { error: '이미 파트너와 연결되어 있습니다.' },
            { status: 409 }
          )
        default:
          return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[POST /api/auth/invite]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
