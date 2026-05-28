import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
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

    const { data: config } = await supabase
      .from('app_config')
      .select('email_verified, passcode_hash')
      .eq('id', 1)
      .single()

    // 이미 설정 완료된 경우
    if (config?.email_verified && config?.passcode_hash) {
      return NextResponse.json({ error: '이미 설정이 완료된 앱입니다.' }, { status: 409 })
    }

    // recovery_email 업데이트
    await supabase
      .from('app_config')
      .update({ recovery_email: email, email_verified: false })
      .eq('id', 1)

    // 토큰 생성 (60분 만료)
    const rawToken = await createToken('verify_email', email, 60)

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/setup/verify?token=${rawToken}`
    await sendEmail({
      to: email,
      subject: '[Today Date] 이메일 인증',
      html: getVerifyEmailTemplate(verifyUrl),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
