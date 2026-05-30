import Link from 'next/link'
import { Heart, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface EmptyStateProps {
  message: string
  hint?: string
  addHref?: string
  addLabel?: string
  /** 검색·필터 결과 없음(true) vs 목록 자체가 빔(false) */
  noResults?: boolean
}

export function EmptyState({ message, hint, addHref, addLabel, noResults }: EmptyStateProps) {
  const Icon = noResults ? SearchX : Heart
  return (
    <div className={styles.empty}>
      <Icon className={cn('mb-3 h-10 w-10', styles.accent)} strokeWidth={1.5} />
      <p className={cn('font-medium', styles.ink)}>{message}</p>
      {hint && <p className={cn('mt-1 text-sm', styles.sub)}>{hint}</p>}
      {addHref && addLabel && (
        <Link
          href={addHref}
          className={cn(styles.gradIcon, 'mt-5 h-auto w-auto px-5 py-2.5 text-sm font-medium')}
        >
          {addLabel}
        </Link>
      )}
    </div>
  )
}
