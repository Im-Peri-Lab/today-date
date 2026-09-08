'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, MailCheck, Send } from 'lucide-react'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

const schema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요.'),
})

type InviteForm = z.infer<typeof schema>

/**
 * 파트너 초대 이메일 입력 폼(/partner).
 *
 * 서버가 이 화면에 도달하기 전에 PAIRED 를 걸러내지만(§ app/partner/page.tsx), 발송
 * 자체의 판정도 서버가 다시 한다 — "이미 가입된 이메일"·"이미 PAIRED"는 클라이언트가
 * 알 수 없는 사실이므로 응답의 오류 문구를 그대로 보여준다(§ api/auth/invite).
 */
export function PartnerInviteForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteForm>({ resolver: zodResolver(schema) })

  async function onSubmit(data: InviteForm) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(json.error ?? '초대를 보내지 못했어요.')
        return
      }

      setSentTo(data.email)
      toast.success('초대 메일을 보냈어요')
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className={cn(styles.gradIcon, 'h-11 w-11')}>
          <MailCheck className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className={cn('text-base font-semibold', styles.ink)}>초대 메일을 보냈어요</p>
          <p className={cn('mt-1 text-sm', styles.sub)}>
            <strong>{sentTo}</strong>
            <br />
            메일함에서 초대를 수락하면 함께 쓰는 공간이 돼요.
          </p>
        </div>
        <p className={cn('text-xs', styles.faint)}>
          초대 링크는 24시간 후 만료됩니다. 만료되면 다시 초대할 수 있어요.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-1 h-10 w-full"
          onClick={() => setSentTo(null)}
        >
          다른 이메일로 다시 보내기
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label="파트너 이메일" htmlFor="partner-email" required error={errors.email?.message}>
        <Input
          id="partner-email"
          type="email"
          autoComplete="off"
          placeholder="partner@example.com"
          {...register('email')}
        />
      </FormField>

      <p className={cn('text-xs leading-relaxed', styles.sub)}>
        초대를 수락하면 파트너는 <strong>지금 쓰는 패스코드</strong>로 로그인해요. 새 패스코드를
        따로 만들지 않습니다.
      </p>

      <Button
        type="submit"
        disabled={isLoading}
        className={cn(styles.detailPrimaryBtn, 'h-10 w-full text-white hover:brightness-105')}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isLoading ? '발송 중...' : '초대 메일 보내기'}
      </Button>
    </form>
  )
}
