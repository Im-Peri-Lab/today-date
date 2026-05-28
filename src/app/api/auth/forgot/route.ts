import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { createToken } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/resend'
import { getResetPasscodeTemplate } from '@/lib/email/templates'

const schema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요.'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      // 사용자 열거 방지: 항상 success
      return NextResponse.json({ success: true })
    }

    const { email } = result.data
    const supabase = getSupabaseClient()

    const { data: config } = await supabase
      .from('app_config')
      .select('recovery_email, email_verified')
      .eq('id', 1)
      .single()

    // 이메일 불일치여도 동일한 응답 (사용자 열거 방지)
    if (config?.email_verified && config?.recovery_email === email) {
      const rawToken = await createToken('reset_passcode', email, 30)
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset?token=${rawToken}`
      await sendEmail({
        to: email,
        subject: '[Today Date] 패스코드 재설정',
        html: getResetPasscodeTemplate(resetUrl),
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
