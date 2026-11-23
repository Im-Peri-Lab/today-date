import * as Sentry from '@sentry/nextjs'
import { sentryOptions } from '@/lib/sentry/options'

// Session Replay 는 쓰지 않는다 — replayIntegration 을 넣지 않고 샘플율도 0 으로 명시한다.
Sentry.init({
  ...sentryOptions(),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})
