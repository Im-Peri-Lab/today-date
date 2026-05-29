'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasscodeInput } from '@/components/PasscodeInput'
import styles from './lock.module.css'

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
    <main className={styles.page}>
      {/* 앱 아이덴티티 */}
      <header className={styles.header}>
        <svg
          className={styles.heart}
          viewBox="0 0 24 24"
          role="img"
          aria-label="Today Date"
        >
          <defs>
            <linearGradient id="heartGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--heart-from, #a855f7)" />
              <stop offset="100%" stopColor="var(--heart-to, #ec4899)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#heartGradient)"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
        <h1 className={styles.title}>Today Date</h1>
        <p className={styles.subtitle}>우리 둘만의 데이트 위시리스트</p>
      </header>

      {/* 패스코드 입력 */}
      <div className={styles.panel}>
        <PasscodeInput
          onComplete={handleComplete}
          disabled={isLoading || isLocked}
          error={error}
          clearOnError
          label={
            isLocked
              ? `잠금 해제까지 ${Math.floor(countdown / 60)}분 ${countdown % 60}초`
              : '패스코드 입력'
          }
        />

        <Link href="/forgot" className={styles.forgot}>
          패스코드를 잊으셨나요?
        </Link>
      </div>
    </main>
  )
}
