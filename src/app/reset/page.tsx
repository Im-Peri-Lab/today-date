'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasscodeInput } from '@/components/PasscodeInput'

export default function ResetPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('유효하지 않은 접근입니다.')
      router.replace('/forgot')
    }
  }, [token, router])

  const handleConfirm = useCallback(async (code: string) => {
    if (code !== passcode) {
      setConfirmError('패스코드가 일치하지 않습니다.')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, passcode }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '오류가 발생했습니다.')
        setPasscode('')
        setConfirmError('')
        return
      }
      toast.success('패스코드가 변경되었습니다!')
      router.push('/lock')
    } finally {
      setIsLoading(false)
    }
  }, [passcode, token, router])

  if (!token) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl border-violet-100">
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-2">{!passcode ? '🔐' : '✅'}</div>
          <CardTitle className="text-xl text-violet-800">
            {!passcode ? '새 패스코드 설정' : '패스코드 확인'}
          </CardTitle>
          <CardDescription>
            {!passcode
              ? '새로운 4~6자리 패스코드를 입력하세요'
              : '패스코드를 한 번 더 입력하세요'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          {!passcode ? (
            <PasscodeInput
              onComplete={(code) => {
                setPasscode(code)
                setError('')
              }}
              disabled={isLoading}
              error={error}
              clearOnError
            />
          ) : (
            <PasscodeInput
              key="confirm"
              onComplete={handleConfirm}
              disabled={isLoading}
              error={confirmError}
              clearOnError
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
