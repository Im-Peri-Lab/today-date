'use client'

import { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

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
        className="w-full text-white hover:brightness-105"
        style={{
          background: 'var(--s-active-fill, linear-gradient(135deg,#a855f7 0%,#ec4899 100%))',
        }}
      >
        {isSubmitting ? '저장 중...' : submitLabel}
      </Button>
    </form>
  )
}
