'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTopLoader } from 'nextjs-toploader'
import { ArrowLeft, Loader2, LogIn } from 'lucide-react'
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

  /**
   * "누구인지" 확인 단계.
   *
   * 함께 쓰는 계정(PAIRED)이면서 이 기기에 기억이 없을 때만 서버가 요구한다
   * (§ api/auth/unlock 의 needsEmail). 맞은 패스코드는 여기 들고 있다가 이메일과
   * 함께 다시 보낸다 — 사용자에게 6자리를 다시 입력하게 하지 않기 위함이다.
   */
  const [identityPasscode, setIdentityPasscode] = useState<string | null>(null)
  const [email, setEmail] = useState('')

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

  const submitUnlock = useCallback(async (passcode: string, identityEmail?: string) => {
    setIsLoading(true)
    setError('')
    topLoader.start()
    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          identityEmail ? { passcode, email: identityEmail } : { passcode }
        ),
      })
      const json = await res.json()

      if (res.status === 423 || json.locked) {
        setIsLocked(true)
        setLockedUntil(new Date(json.lockedUntil))
        topLoader.done()
        return
      }

      /*
       * 패스코드는 맞았지만 두 파트너 중 누구인지 모른다 → 이메일 단계로 넘어간다.
       * 이 응답은 패스코드를 통과한 요청에만 오므로, 화면이 이 분기를 타는 것 자체가
       * "패스코드는 맞았다"는 뜻이다. 그래서 오류(빨강)가 아니라 안내로 보여준다.
       */
      if (json.needsEmail) {
        setIdentityPasscode(passcode)
        setError(identityEmail ? (json.error ?? '') : '')
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

  const handleComplete = useCallback(
    (code: string) => submitUnlock(code),
    [submitUnlock]
  )

  const handleIdentitySubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!identityPasscode || !email.trim()) return
      submitUnlock(identityPasscode, email.trim())
    },
    [identityPasscode, email, submitUnlock]
  )

  /** 패스코드부터 다시 — 이메일 단계를 벗어나는 유일한 길(잘못 입력했을 때의 탈출구). */
  const restartFromPasscode = useCallback(() => {
    setIdentityPasscode(null)
    setEmail('')
    setError('')
  }, [])

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

      {identityPasscode && !showLock ? (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBadge}>
              <LogIn size={22} strokeWidth={1.75} />
            </span>
            <p className={styles.cardTitle}>누구로 로그인하시나요?</p>
            <p className={styles.cardDesc}>
              함께 쓰는 계정이라 이 기기에서 한 번만 확인해요.
              <br />
              다음부터는 패스코드만 입력하면 돼요.
            </p>
          </div>
          <form onSubmit={handleIdentitySubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="identity-email" className={styles.label}>
                내 이메일 주소
              </label>
              <input
                id="identity-email"
                type="email"
                autoComplete="email"
                autoFocus
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className={styles.errorText}>{error}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={styles.btnPrimary}
            >
              {isLoading ? (
                <Loader2 size={18} strokeWidth={1.75} className="animate-spin" />
              ) : (
                <LogIn size={18} strokeWidth={1.75} />
              )}
              {isLoading ? '확인 중...' : '로그인'}
            </button>
            <button type="button" onClick={restartFromPasscode} className={styles.link}>
              <ArrowLeft size={15} strokeWidth={1.75} aria-hidden />
              패스코드 다시 입력
            </button>
          </form>
        </div>
      ) : (
        <PasscodeInput
          onComplete={handleComplete}
          disabled={isLoading || showLock}
          error={showLock ? '' : error}
          clearOnError
          label={showLock ? undefined : '패스코드 입력'}
        />
      )}
    </AuthLayout>
  )
}
