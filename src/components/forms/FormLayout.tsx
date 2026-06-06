'use client'

import { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface FormLayoutProps {
  onSubmit: (e: FormEvent) => void
  isSubmitting: boolean
  submitLabel: string
  children: ReactNode
}

export function FormLayout({ onSubmit, isSubmitting, submitLabel, children }: FormLayoutProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {children}
      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(styles.detailPrimaryBtn, 'h-12 w-full text-white hover:brightness-105')}
      >
        {isSubmitting ? '저장 중...' : submitLabel}
      </Button>
    </form>
  )
}
