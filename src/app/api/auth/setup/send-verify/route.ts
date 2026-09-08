import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getWorkspaceStatus } from '@/lib/auth/couple'
import { sendPartnerInvite } from '@/lib/auth/invite'
import { createToken, findPendingInvite } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/resend'
import { getVerifyEmailTemplate } from '@/lib/email/templates'

const schema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요.'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: '올바른 이메일 주소를 입력하세요.' }, { status: 400 })
    }

    const { email } = result.data
    const supabase = getSupabaseClient()

    /**
     * 대기 중인 파트너 초대가 있으면 새 커플을 만들지 않는다.
     *
     * 파트너가 초대 메일을 못 찾고 직접 가입을 시도하는 흐름이다. 여기서 그대로
     * 진행하면 커플이 하나 더 생기고, 나중에 초대 링크를 눌러도 users.email 이
     * 전역 unique 라 합류가 영구히 막힌다 — 되돌리려면 DB 를 손봐야 한다.
     *
     * 그래서 커플 생성 전에 이 검사를 먼저 한다(설정 완료 여부보다도 앞이다 —
     * 초대는 이미 설정이 끝난 커플만 보낼 수 있으므로 아래 409 에 먼저 걸린다).
     * 초대를 다시 발송해 초대 수락 플로우(/invite)로 이어준다: 원문 토큰은 메일함에만
     * 있어 재전송이 불가능하므로 같은 커플·같은 이메일로 새 초대를 발급한다
     * (sendPartnerInvite 가 기존 대기 초대를 폐기하므로 유효한 초대는 여전히 한 장).
     *
     * 응답에 invite: true 를 실어 화면이 "인증 메일" 대신 "초대 메일" 안내를 띄우게 한다.
     *
     * 트레이드오프: 이 분기는 "이 이메일로 대기 중인 초대가 있다"를 응답으로 드러낸다 —
     * 이 라우트의 다른 경로가 지키는 사용자 열거 방지에서 벗어난다. 그 대가로 초대받은
     * 사람이 왜 새 커플이 안 만들어지는지 알 수 있고, 실제로 합류할 수 있게 된다.
     * 드러나는 사실은 "초대 대기 여부"뿐이고(가입 여부·패스코드·커플 정보는 아니다)
     * 질의자가 그 이메일 주소를 이미 알고 있어야 하므로 열거 가치가 낮다고 판단했다.
     */
    const pendingInvite = await findPendingInvite(email)
    if (pendingInvite?.couple_id) {
      const resent = await sendPartnerInvite({
        coupleId: pendingInvite.couple_id,
        targetEmail: email,
      })

      if (!resent.ok) {
        // already_registered — 초대는 대기 중인데 그 사이 그 이메일이 가입됐다.
        // already_paired    — 초대한 커플이 다른 사람으로 이미 짝을 채웠다.
        // 어느 쪽이든 이 초대로는 합류할 수 없다.
        console.error('[send-verify] 대기 초대 재발송 실패:', resent.reason)
        return NextResponse.json(
          { error: '이 이메일로는 설정을 진행할 수 없습니다.' },
          { status: 409 }
        )
      }

      return NextResponse.json({ success: true, invite: true })
    }

    const status = await getWorkspaceStatus()

    // 이미 설정 완료된 경우
    if (status.setupComplete) {
      return NextResponse.json({ error: '이미 설정이 완료된 앱입니다.' }, { status: 409 })
    }

    // 커플 확보 — 최초 설정이면 이 시점에 커플 행이 만들어진다.
    // 패스코드는 아직 없으므로(passcode_hash NULL) 설정은 여전히 미완료 상태다.
    let coupleId = status.couple?.id ?? null
    if (!coupleId) {
      // 컬럼을 명시적으로 넘긴다 — 빈 본문 insert({}) 는 PostgREST 에서 동작이 애매하고,
      // 이 경로(커플 0개)는 프로덕션에서 재현해 검증할 수 없기 때문에 추측에 기대지 않는다.
      // 값은 012 마이그레이션의 컬럼 기본값과 같다.
      const { data: created, error: coupleError } = await supabase
        .from('couples')
        .insert({ failed_attempts: 0, session_version: 1 })
        .select('id')
        .single()

      if (coupleError || !created) {
        console.error('[send-verify] couple 생성 실패:', coupleError)
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
      }
      coupleId = created.id
    }

    // 사용자 확보 — app_config 시절 `recovery_email` 을 덮어쓰고 email_verified 를
    // false 로 되돌렸던 동작과 같다. 설정 중에 이메일을 바꿔 다시 보내면 기존
    // 사용자 행의 이메일이 갱신되고 인증 상태가 초기화된다.
    const existingUser =
      status.users.find((u) => u.email === email) ?? status.users[0] ?? null

    const { error: userError } = existingUser
      ? await supabase
          .from('users')
          .update({ email, email_verified: false })
          .eq('id', existingUser.id)
      : await supabase
          .from('users')
          .insert({ couple_id: coupleId, email, email_verified: false })

    if (userError) {
      // users.email 은 전역 unique — 다른 커플에 이미 등록된 이메일이면 여기로 온다.
      // 어느 쪽이 원인인지 알려주지 않는다(사용자 열거 방지).
      console.error('[send-verify] user 등록 실패:', userError)
      return NextResponse.json(
        { error: '이 이메일로는 설정을 진행할 수 없습니다.' },
        { status: 409 }
      )
    }

    // 토큰 생성 (60분 만료)
    const rawToken = await createToken('verify_email', email, 60)

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/setup/verify?token=${rawToken}`
    const emailResult = await sendEmail({
      to: email,
      subject: '[Today Date] 이메일 인증',
      html: getVerifyEmailTemplate(verifyUrl),
    })

    if (!emailResult.success) {
      console.error('[send-verify] email failed:', emailResult.error)
    }

    // 사용자 열거 방지: 이메일 실패 여부와 무관하게 항상 200 반환
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[send-verify] unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
