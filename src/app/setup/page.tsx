'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail, MailCheck } from 'lucide-react'
import { PasscodeInput } from '@/components/PasscodeInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import styles from '@/components/auth/auth.module.css'

const emailSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요.'),
})

type EmailForm = z.infer<typeof emailSchema>
type Step = 1 | 2 | 3
// 패스코드 단계 내부 상태: 'set'=첫 입력, 'confirm'=확인 입력
type PasscodeSubStep = 'set' | 'confirm'

function SetupFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topLoader = useTopLoader()
  const [step, setStep] = useState<Step>(1)
  const [sentEmail, setSentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 패스코드 단계 상태 (step 3)
  const [passcodeSubStep, setPasscodeSubStep] = useState<PasscodeSubStep>('set')
  const [firstPasscode, setFirstPasscode] = useState('')
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setStep(3)
    }
    if (searchParams.get('error') === 'invalid-token') {
      toast.error('링크가 유효하지 않거나 만료되었습니다. 다시 시도해 주세요.')
    }
  }, [searchParams])


  const { register, handleSubmit, formState: { errors } } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  })

  async function onSendVerify(data: EmailForm) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/setup/send-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '오류가 발생했습니다.')
        return
      }
      setSentEmail(data.email)
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  // 첫 번째 패스코드 입력 완료 → 확인 단계로만 전환 (API 호출 없음)
  function onFirstPasscodeComplete(code: string) {
    setFirstPasscode(code)
    setConfirmError('')
    setPasscodeSubStep('confirm')
  }

  // 확인 입력 완료 → 일치 검증 후 단 1회 API 호출
  async function onConfirmPasscodeComplete(code: string) {
    if (code !== firstPasscode) {
      setConfirmError('패스코드가 일치하지 않습니다.')
      return
    }
    setIsLoading(true)
    setConfirmError('')
    topLoader.start()
    try {
      const res = await fetch('/api/auth/setup/passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: firstPasscode }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '오류가 발생했습니다.')
        // 실패 시 첫 번째 단계로 리셋
        setFirstPasscode('')
        setPasscodeSubStep('set')
        topLoader.done()
        return
      }
      toast.success('패스코드가 설정되었습니다!')
      router.push('/')
    } catch {
      topLoader.done()
    } finally {
      setIsLoading(false)
    }
  }

  const subtitle =
    step === 1
      ? '둘만의 공간을 만들어요'
      : step === 2
        ? '메일함을 확인해 주세요'
        : '패스코드만 정하면 끝이에요'

  return (
    <AuthLayout subtitle={subtitle}>
      {/* 단계 인디케이터 */}
      <div className={styles.steps} role="status" aria-label={`${step}/3 단계`}>
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`${styles.stepDot} ${s === step ? styles.stepDotActive : ''}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBadge}>
              <Mail size={22} strokeWidth={1.75} />
            </span>
            <p className={styles.cardTitle}>이메일 인증</p>
          </div>
          <form onSubmit={handleSubmit(onSendVerify)} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>이메일 주소</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={styles.input}
                {...register('email')}
              />
              {errors.email && (
                <p className={styles.errorText}>{errors.email.message}</p>
              )}
            </div>
            <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
              <Mail size={18} strokeWidth={1.75} />
              {isLoading ? '발송 중...' : '인증 메일 발송'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBadge}>
              <MailCheck size={22} strokeWidth={1.75} />
            </span>
            <p className={styles.cardTitle}>메일을 확인해 주세요</p>
            <p className={styles.cardDesc}>
              <strong>{sentEmail}</strong>으로<br />인증 링크를 보냈습니다.
            </p>
          </div>
          <p className={styles.hint}>
            메일함에서 <strong>이메일 인증하기</strong> 버튼을 눌러주세요.<br />
            링크는 1시간 후 만료됩니다.
          </p>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => setStep(1)}
          >
            다시 발송하기
          </button>
        </div>
      )}

      {step === 3 &&
        (passcodeSubStep === 'set' ? (
          // key로 완전 재마운트 보장 — 이전 value 잔재 없음
          <PasscodeInput
            key="set"
            onComplete={onFirstPasscodeComplete}
            disabled={isLoading}
            label="패스코드 설정"
          />
        ) : (
          <PasscodeInput
            key="confirm"
            onComplete={onConfirmPasscodeComplete}
            disabled={isLoading}
            error={confirmError}
            clearOnError
            label="패스코드 확인"
          />
        ))}
    </AuthLayout>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<AuthLayout subtitle="둘만의 공간을 만들어요">{null}</AuthLayout>}>
      <SetupFlow />
    </Suspense>
  )
}
