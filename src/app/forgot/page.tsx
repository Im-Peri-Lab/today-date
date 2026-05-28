'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요.'),
})
type Form = z.infer<typeof schema>

export default function ForgotPage() {
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setIsLoading(true)
    try {
      await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      // 항상 성공으로 표시 (사용자 열거 방지)
      setSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl border-violet-100">
        {!sent ? (
          <>
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mb-2">🔑</div>
              <CardTitle className="text-xl text-violet-800">패스코드 재설정</CardTitle>
              <CardDescription>등록한 이메일 주소를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {isLoading ? '발송 중...' : '재설정 메일 발송'}
                </Button>
                <Link href="/lock">
                  <Button variant="ghost" className="w-full text-violet-600" type="button">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    돌아가기
                  </Button>
                </Link>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mb-2">📬</div>
              <CardTitle className="text-xl text-violet-800">메일을 확인해 주세요</CardTitle>
              <CardDescription>
                이메일이 등록되어 있다면<br />재설정 링크를 보내드렸습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 text-center mb-4">
                링크는 30분 후 만료됩니다.
              </p>
              <Link href="/lock">
                <Button variant="outline" className="w-full border-violet-200 text-violet-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  잠금 화면으로
                </Button>
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  )
}
