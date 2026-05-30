'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PasscodeInput } from '@/components/PasscodeInput'
import { AuthLayout } from '@/components/auth/AuthLayout'

type SubStep = 'set' | 'confirm'

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [subStep, setSubStep] = useState<SubStep>('set')
  const [firstPasscode, setFirstPasscode] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // 일회용 토큰이라 중복 제출 시 두 번째부터는 "만료된 링크" 오류가 난다.
  // setIsLoading 은 비동기라 동기적 재호출을 막지 못하므로 ref 로 in-flight 를 가드한다.
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!token) {
      toast.error('유효하지 않은 접근입니다.')
      router.replace('/forgot')
    }
  }, [token, router])

  function onFirstPasscodeComplete(code: string) {
    setFirstPasscode(code)
    setConfirmError('')
    setSubStep('confirm')
  }

  async function onConfirmPasscodeComplete(code: string) {
    if (code !== firstPasscode) {
      setConfirmError('패스코드가 일치하지 않습니다.')
      return
    }
    if (submittingRef.current) return
    submittingRef.current = true
    setIsLoading(true)
    setConfirmError('')
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, passcode: firstPasscode }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '오류가 발생했습니다.')
        setFirstPasscode('')
        setSubStep('set')
        submittingRef.current = false
        return
      }
      toast.success('패스코드가 변경되었습니다!')
      router.push('/lock')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) return null

  return (
    <AuthLayout
      subtitle={
        subStep === 'set'
          ? '새로운 4~6자리 패스코드를 설정하세요'
          : '패스코드를 한 번 더 입력하세요'
      }
    >
      {subStep === 'set' ? (
        <PasscodeInput
          key="set"
          onComplete={onFirstPasscodeComplete}
          disabled={isLoading}
          label="새 패스코드 입력"
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
      )}
    </AuthLayout>
  )
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  )
}
