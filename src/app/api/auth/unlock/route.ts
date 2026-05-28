import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'
import { verifyPasscode } from '@/lib/auth/passcode'
import { getSession } from '@/lib/auth/session'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 10

const schema = z.object({
  passcode: z.string().min(1),
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

    const { data: config, error: dbError } = await supabase
      .from('app_config')
      .select('passcode_hash, failed_attempts, locked_until, session_version')
      .eq('id', 1)
      .single()

    if (dbError || !config?.passcode_hash) {
      return NextResponse.json({ error: '앱 설정이 완료되지 않았습니다.' }, { status: 403 })
    }

    // 잠금 확인
    if (config.locked_until && new Date(config.locked_until) > new Date()) {
      return NextResponse.json(
        { error: '잠시 후 다시 시도하세요.', locked: true, lockedUntil: config.locked_until },
        { status: 423 }
      )
    }

    const isCorrect = await verifyPasscode(passcode, config.passcode_hash)

    if (!isCorrect) {
      const newAttempts = (config.failed_attempts ?? 0) + 1
      const shouldLock = newAttempts >= MAX_ATTEMPTS
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
        : null

      await supabase
        .from('app_config')
        .update({ failed_attempts: newAttempts, locked_until: lockedUntil })
        .eq('id', 1)

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

    // 성공
    await supabase
      .from('app_config')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('id', 1)

    const session = await getSession()
    session.authenticated = true
    session.lastVerifiedAt = Date.now()
    session.sessionVersion = config.session_version ?? 1
    await session.save()

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
