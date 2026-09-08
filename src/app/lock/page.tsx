'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTopLoader } from 'nextjs-toploader'
import { PasscodeInput } from '@/components/PasscodeInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { cn } from '@/lib/utils'
import styles from '@/components/auth/auth.module.css'

// 로컬에서 잠금 메시지 디자인을 확인하려면 true 로 바꾼다. (배포 시 false 유지)
// true 일 때는 5회 실패 없이도 잠금 배너가 보이고, 09:42 가짜 카운트다운이 표시된다.
const DEV_FORCE_LOCK = false

function formatCountdown(totalSeconds: number) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/**
 * 초대 링크(/invite)가 남기는 안내.
 *
 * 성공(joined)이든 실패(invite=...)든 초대받은 사람은 이 화면으로 온다. 성공이면 다음
 * 할 일이 "파트너와 함께 쓰는 기존 패스코드 입력"이므로 그 안내가 패스코드 키패드
 * 위에 있어야 하고, 실패면 왜 못 들어왔는지를 같은 자리에서 알려준다.
 * 문구는 src/app/invite/route.ts 의 FAILURE_QUERY 코드와 1:1로 맞춘다.
 */
const INVITE_MESSAGES: Record<string, { title: string; desc: string }> = {
  invalid: {
    title: '초대 링크가 유효하지 않아요',
    desc: '링크가 만료되었거나 이미 사용되었습니다. 파트너에게 다시 초대를 요청해 주세요.',
  },
  registered: {
    title: '이미 가입된 이메일이에요',
    desc: '이 이메일은 다른 계정에서 사용 중입니다. 파트너에게 다른 이메일로 초대를 요청해 주세요.',
  },
  paired: {
    title: '이미 두 사람이 연결된 커플이에요',
    desc: '더 이상 합류할 자리가 없습니다.',
  },
  error: {
    title: '초대를 처리하지 못했어요',
    desc: '잠시 후 다시 시도해 주세요.',
  },
}

function InviteNotice() {
  const searchParams = useSearchParams()
  const joined = searchParams.get('joined') === '1'
  const failure = searchParams.get('invite')

  if (joined) {
    return (
      <div className={styles.inviteNotice} role="status">
        <p className={styles.inviteTitle}>파트너 연결이 완료됐어요 💜</p>
        <p className={styles.inviteDesc}>
          함께 쓰는 기존 패스코드를 입력하면 바로 시작할 수 있어요.
        </p>
      </div>
    )
  }

  const message = failure ? INVITE_MESSAGES[failure] : undefined
  if (!message) return null

  return (
    <div className={cn(styles.inviteNotice, styles.inviteNoticeError)} role="alert">
      <p className={styles.inviteTitle}>{message.title}</p>
      <p className={styles.inviteDesc}>{message.desc}</p>
    </div>
  )
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
      {/* useSearchParams 는 Suspense 경계가 필요하다(§ src/app/setup/page.tsx 와 동일). */}
      <Suspense fallback={null}>
        <InviteNotice />
      </Suspense>

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
