'use client'

import { useEffect, useState } from 'react'
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

export default function SetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(1)
  const [sentEmail, setSentEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  async function onPasscodeSet(code: string) {
    setPasscode(code)
    setPasscodeError('')
  }

  async function onConfirmSet(code: string) {
    if (code !== passcode) {
      setConfirmError('패스코드가 일치하지 않습니다.')
      return
    }
    setIsLoading(true)
    setConfirmError('')
    try {
      const res = await fetch('/api/auth/setup/passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '오류가 발생했습니다.')
        setPasscode('')
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
                    placeholder="example@email.com"
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
              {!passcode ? (
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
              {!passcode ? (
                <PasscodeInput
                  onComplete={onPasscodeSet}
                  disabled={isLoading}
                  error={passcodeError}
                />
              ) : (
                <PasscodeInput
                  key="confirm"
                  onComplete={onConfirmSet}
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
