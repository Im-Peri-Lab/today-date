'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasscodeInput } from '@/components/PasscodeInput'

export default function LockPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!lockedUntil) return
    function tick() {
      const remaining = Math.max(0, Math.ceil((lockedUntil!.getTime() - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining === 0) {
        setIsLocked(false)
        setLockedUntil(null)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [lockedUntil])

  const handleComplete = useCallback(async (code: string) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      })
      const json = await res.json()

      if (res.status === 423 || json.locked) {
        setIsLocked(true)
        setLockedUntil(new Date(json.lockedUntil))
        setError('너무 많이 실패했습니다. 잠시 후 다시 시도하세요.')
        return
      }

      if (!res.ok) {
        setError(json.error ?? '패스코드가 틀렸습니다.')
        return
      }

      router.push('/')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }, [router])

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-violet-50 to-purple-100 flex flex-col items-center justify-center gap-7 px-4 py-8">
      {/* 앱 아이덴티티 */}
      <header className="text-center space-y-2">
        <div className="text-5xl">💜</div>
        <h1 className="text-3xl font-bold tracking-tight text-violet-800">Today Date</h1>
        <p className="max-w-xs text-sm leading-relaxed text-violet-500">
          둘이서 모으는 데이트 위시리스트<br />
          오늘 뭐할지 · 어디 갈지 골라드려요
        </p>
      </header>

      <Card className="w-full max-w-sm shadow-xl border-violet-100">
        <CardHeader className="text-center pb-2">
          <div className="text-3xl mb-1">🔒</div>
          <CardTitle className="text-lg text-violet-800">
            {isLocked ? '잠시 잠겨 있어요' : '두 사람만의 공간'}
          </CardTitle>
          <CardDescription>
            {isLocked
              ? `잠금 해제까지 ${Math.floor(countdown / 60)}분 ${countdown % 60}초`
              : '패스코드를 입력하세요'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 py-4">
          <PasscodeInput
            onComplete={handleComplete}
            disabled={isLoading || isLocked}
            error={error}
            clearOnError
          />
          <Link
            href="/forgot"
            className="text-sm text-violet-500 hover:text-violet-700 underline underline-offset-2"
          >
            패스코드를 잊으셨나요?
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
