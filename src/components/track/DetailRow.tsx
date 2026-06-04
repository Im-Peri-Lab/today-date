import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface DetailRowProps {
  label: string
  children: ReactNode
}

/**
 * 등록 정보 블록의 라벨-값 행. 행마다 얇은 상단 구분선(sheetRow)으로 나누되,
 * 카드 헤더 바로 아래 첫 행은 구분선/상단 여백을 없앤다.
 */
export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className={cn(styles.sheetRow, 'first:border-t-0 first:pt-0')}>
      <p className={cn('mb-1.5 text-xs font-medium uppercase tracking-wide', styles.sub)}>{label}</p>
      <div className={cn('text-sm', styles.ink)}>{children}</div>
    </div>
  )
}
