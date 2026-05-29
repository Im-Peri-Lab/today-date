'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasscodeInput } from '@/components/PasscodeInput'

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
        return
      }
      toast.success('패스코드가 설정되었습니다!')
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl border-violet-100">
        {step === 1 && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mb-2">💜</div>
              <CardTitle className="text-2xl text-violet-800">Today Date</CardTitle>
              <CardDescription>시작하려면 이메일을 인증하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSendVerify)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 주소</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="[MASKED_EMAIL]"
                    autoComplete="email"
                    {...register('email')}
                    className="border-violet-200 focus-visible:ring-violet-500"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-700 hover:bg-violet-800"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? '발송 중...' : '인증 메일 발송'}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mb-2">📬</div>
              <CardTitle className="text-xl text-violet-800">메일을 확인해 주세요</CardTitle>
              <CardDescription>
                <span className="font-medium text-violet-700">{sentEmail}</span>으로<br />
                인증 링크를 보냈습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                메일함에서 <strong>이메일 인증하기</strong> 버튼을 눌러주세요.<br />
                링크는 1시간 후 만료됩니다.
              </p>
              <Button
                variant="outline"
                className="w-full border-violet-200 text-violet-700"
                onClick={() => setStep(1)}
              >
                다시 발송하기
              </Button>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="text-center pb-2">
              {passcodeSubStep === 'set' ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-violet-500 mx-auto mb-2" />
                  <CardTitle className="text-xl text-violet-800">패스코드 설정</CardTitle>
                  <CardDescription>4~6자리 숫자 패스코드를 설정하세요</CardDescription>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">🔐</div>
                  <CardTitle className="text-xl text-violet-800">패스코드 확인</CardTitle>
                  <CardDescription>패스코드를 한 번 더 입력하세요</CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              {passcodeSubStep === 'set' ? (
                // key로 완전 재마운트 보장 — 이전 value 잔재 없음
                <PasscodeInput
                  key="set"
                  onComplete={onFirstPasscodeComplete}
                  disabled={isLoading}
                />
              ) : (
                <PasscodeInput
                  key="confirm"
                  onComplete={onConfirmPasscodeComplete}
                  disabled={isLoading}
                  error={confirmError}
                  clearOnError
                />
              )}
            </CardContent>
          </>
        )}
      </Card>
    </main>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupFlow />
    </Suspense>
  )
}
