'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import styles from '@/components/auth/auth.module.css'

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
    <AuthShell
      subtitle="패스코드를 잊으셨나요?"
      footer={
        <Link href="/lock" className={styles.link}>
          잠금 화면으로 돌아가기
        </Link>
      }
    >
      {!sent ? (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBadge}>
              <Mail size={22} strokeWidth={1.75} />
            </span>
            <p className={styles.cardTitle}>패스코드 재설정</p>
            <p className={styles.cardDesc}>등록한 이메일 주소를 입력하세요</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>이메일 주소</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
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
              {isLoading ? '발송 중...' : '재설정 메일 발송'}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBadge}>
              <MailCheck size={22} strokeWidth={1.75} />
            </span>
            <p className={styles.cardTitle}>메일을 확인해 주세요</p>
            <p className={styles.cardDesc}>
              이메일이 등록되어 있다면<br />재설정 링크를 보내드렸습니다.
            </p>
          </div>
          <p className={styles.hint}>링크는 30분 후 만료됩니다.</p>
        </div>
      )}
    </AuthShell>
  )
}
