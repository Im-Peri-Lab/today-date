'use client'

import { useEffect } from 'react'
import { reportBoundaryError } from '@/lib/observability'

/**
 * 루트 레이아웃 자체가 깨졌을 때의 최후 경계. layout.tsx 를 대체하므로 <html>·<body> 를 직접 그리고,
 * 앱의 CSS·프로바이더에 의존하지 않는 최소 화면만 둔다.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error('[global error boundary]', error)
    reportBoundaryError(error, 'global')
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>잠시 문제가 생겼어요</p>
        <p style={{ fontSize: 14, margin: 0, opacity: 0.7 }}>잠시 후 다시 시도해주세요.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ height: 40, padding: '0 20px', borderRadius: 10, border: 0, background: '#111', color: '#fff' }}
        >
          다시 시도
        </button>
      </body>
    </html>
  )
}
