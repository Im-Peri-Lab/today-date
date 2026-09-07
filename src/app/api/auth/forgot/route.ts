import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserByEmail } from '@/lib/auth/couple'
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

    // 이메일로 사용자를 특정한다 — 커플이 여러 개가 되어도 그대로 동작한다.
    const user = await getUserByEmail(email)

    // 등록되지 않은 이메일이어도 동일한 응답 (사용자 열거 방지)
    if (user?.email_verified) {
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
