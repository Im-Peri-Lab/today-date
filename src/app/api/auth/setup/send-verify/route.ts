import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getWorkspaceStatus } from '@/lib/auth/couple'
import { createToken } from '@/lib/auth/tokens'
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
