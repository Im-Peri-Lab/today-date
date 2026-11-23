// TEMP — Sentry Preview 검증 전용. 확인이 끝나면 이 파일(과 이 커밋)을 제거한다. main 에 남기지 않는다.
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { reportError } from '@/lib/observability'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Preview 배포에서만 동작한다. Production 에서는 404.
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  // ?mode=noflush — 실제 API 라우트처럼 reportError 만 부르고 flush 없이 바로 응답한다.
  if (req.nextUrl.searchParams.get('mode') === 'noflush') {
    reportError('[GET /api/auth/sentry-verify noflush]', new Error('sentry noflush verification'))
    return NextResponse.json({ mode: 'noflush', sent: true })
  }
  const client = Sentry.getClient()
  const opts = client?.getOptions()
  // 가짜 PII 를 일부러 메시지·extra 에 넣어 beforeSend 가 거르는지 확인한다.
  const eventId = Sentry.captureException(
    new Error('sentry preview verification — fake-user@example.com passcode 1234'),
    {
      tags: { route: '[GET /api/auth/sentry-verify]' },
      extra: { email: 'fake-user@example.com', passcode: '1234' },
    }
  )
  const flushed = await Sentry.flush(3000)
  return NextResponse.json({
    initialized: Sentry.isInitialized(),
    hasClient: Boolean(client),
    hasDsn: Boolean(opts?.dsn),
    hasEnvDsn: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    enabled: opts?.enabled ?? null,
    environment: opts?.environment ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    runtime: process.env.NEXT_RUNTIME ?? null,
    eventId: eventId ?? null,
    flushed,
  })
}
