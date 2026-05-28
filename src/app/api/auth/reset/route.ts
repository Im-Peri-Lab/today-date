import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { hashPasscode } from '@/lib/auth/passcode'
import { verifyToken, markTokenUsed } from '@/lib/auth/tokens'
import { getSession } from '@/lib/auth/session'

const schema = z.object({
  token: z.string().min(1),
  passcode: z
    .string()
    .min(4, '4자리 이상 입력하세요.')
    .max(6, '6자리 이하로 입력하세요.')
    .regex(/^\d+$/, '숫자만 입력하세요.'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, passcode } = result.data

    const tokenRow = await verifyToken(token, 'reset_passcode')
    if (!tokenRow) {
      return NextResponse.json({ error: '유효하지 않거나 만료된 링크입니다.' }, { status: 400 })
    }

    const hash = await hashPasscode(passcode)
    const supabase = getSupabaseClient()

    // 현재 session_version 조회 후 +1
    const { data: config } = await supabase
      .from('app_config')
      .select('session_version')
      .eq('id', 1)
      .single()

    const newVersion = (config?.session_version ?? 1) + 1

    await supabase
      .from('app_config')
      .update({
        passcode_hash: hash,
        failed_attempts: 0,
        locked_until: null,
        session_version: newVersion,
      })
      .eq('id', 1)

    await markTokenUsed(tokenRow.id)

    // 기존 세션 파기
    const session = await getSession()
    session.destroy()

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
