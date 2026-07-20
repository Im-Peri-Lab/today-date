'use client'

import { FormEvent, MouseEvent, ReactNode, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface FormLayoutProps {
  onSubmit: (e: FormEvent) => void
  onSubmitAndContinue: (e: MouseEvent<HTMLButtonElement>) => void
  isSubmitting: boolean
  submitLabel: string
  children: ReactNode
}

export function FormLayout({
  onSubmit,
  onSubmitAndContinue,
  isSubmitting,
  submitLabel,
  children,
}: FormLayoutProps) {
  const [submittingAction, setSubmittingAction] = useState<'submit' | 'continue'>('submit')

  return (
    <form
      onSubmit={(event) => {
        setSubmittingAction('submit')
        onSubmit(event)
      }}
      className="space-y-5"
    >
      {children}
      <div className="space-y-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(styles.detailPrimaryBtn, 'h-12 w-full text-white hover:brightness-105')}
        >
          {isSubmitting && submittingAction === 'submit' && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isSubmitting && submittingAction === 'submit' ? '저장 중...' : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          className="h-10 w-full"
          onClick={(event) => {
            setSubmittingAction('continue')
            onSubmitAndContinue(event)
          }}
        >
          {isSubmitting && submittingAction === 'continue' && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isSubmitting && submittingAction === 'continue'
            ? '저장 중...'
            : '저장하고 계속 등록하기'}
        </Button>
      </div>
    </form>
  )
}
