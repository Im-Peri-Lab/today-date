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
 * - 부모가 grid-cols-2 일 때 wide=false 는 1열, wide=true 는 2열 점유.
 * - 구분선 없이 sheetRow의 padding-top만으로 필드 간 여백을 만든다.
 * - 라벨: faint + font-normal(캡션 톤) — 값이 라벨보다 또렷하게.
 */
export function DetailRow({ label, children, wide }: DetailRowProps) {
  return (
    <div className={cn(styles.sheetRow, wide && 'sm:col-span-2')}>
      {/* 라벨: faint 톤 + 일반 굵기 — 값(ink/기본)보다 약하게 */}
      <p className={cn('mb-1.5 uppercase tracking-wide', styles.captionText)}>
        {label}
      </p>
      <div className={styles.bodyText}>{children}</div>
    </div>
  )
}
