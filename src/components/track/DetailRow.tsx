import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface DetailRowProps {
  label: string
  children: ReactNode
  /**
   * true: sm 브레이크포인트 이상에서 2열 그리드의 전체폭(col-span-2).
   * 메모·참고 링크처럼 긴 텍스트에 사용. 기본 false.
   */
  wide?: boolean
}

/**
 * 등록 정보 블록의 라벨-값 셀.
 * 부모 컨테이너가 grid-cols-2 일 때 wide=false 는 1열, wide=true 는 2열을 점유.
 * 각 셀 상단 구분선(sheetRow)으로 행을 시각적으로 분리한다.
 */
export function DetailRow({ label, children, wide }: DetailRowProps) {
  return (
    <div className={cn(styles.sheetRow, wide && 'sm:col-span-2')}>
      <p className={cn('mb-1.5 text-xs font-medium uppercase tracking-wide', styles.sub)}>{label}</p>
      <div className={cn('text-sm', styles.ink)}>{children}</div>
    </div>
  )
}
