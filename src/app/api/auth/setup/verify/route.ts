import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { markUserEmailVerified } from '@/lib/auth/couple'
import { verifyToken, markTokenUsed } from '@/lib/auth/tokens'

const schema = z.object({
  token: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 })
    }

    const { token } = result.data
    const tokenRow = await verifyToken(token, 'verify_email')

    if (!tokenRow) {
      return NextResponse.json({ error: '유효하지 않거나 만료된 링크입니다.' }, { status: 400 })
    }

    // 토큰이 가리키는 이메일의 users 행을 인증 완료로 표시한다.
    const verified = await markUserEmailVerified(tokenRow.target_email)
    if (!verified) {
      return NextResponse.json({ error: '유효하지 않거나 만료된 링크입니다.' }, { status: 400 })
    }

    await markTokenUsed(tokenRow.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
