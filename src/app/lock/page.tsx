'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTopLoader } from 'nextjs-toploader'
import { PasscodeInput } from '@/components/PasscodeInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import styles from '@/components/auth/auth.module.css'

// 로컬에서 잠금 메시지 디자인을 확인하려면 true 로 바꾼다. (배포 시 false 유지)
// true 일 때는 5회 실패 없이도 잠금 배너가 보이고, 09:42 가짜 카운트다운이 표시된다.
const DEV_FORCE_LOCK = false

function formatCountdown(totalSeconds: number) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function LockPage() {
  const router = useRouter()
  const topLoader = useTopLoader()
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
    topLoader.start()
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
        topLoader.done()
        return
      }

      if (!res.ok) {
        setError(json.error ?? '패스코드가 틀렸습니다.')
        topLoader.done()
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      topLoader.done()
    } finally {
      setIsLoading(false)
    }
  }, [router, topLoader])

  const showLock = isLocked || DEV_FORCE_LOCK
  const displaySeconds = DEV_FORCE_LOCK && !isLocked ? 582 : countdown

  return (
    <AuthLayout
      subtitle="우리 둘만의 데이트 위시리스트"
      footer={
        <Link href="/forgot" className={styles.link}>
          패스코드를 잊으셨나요?
        </Link>
      }
    >
      {showLock && (
        <div className={styles.lockNotice} role="alert">
          <p className={styles.lockTitle}>잠시 후 다시 시도해주세요</p>
          <p className={styles.lockTimer}>
            남은 시간 {formatCountdown(displaySeconds)}
          </p>
        </div>
      )}

      <PasscodeInput
        onComplete={handleComplete}
        disabled={isLoading || showLock}
        error={showLock ? '' : error}
        clearOnError
        label={showLock ? undefined : '패스코드 입력'}
      />
    </AuthLayout>
  )
}
