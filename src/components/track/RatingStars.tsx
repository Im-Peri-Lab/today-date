import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  /** sm=16px(표시) · md=28px · lg=32px(편집 터치 타깃) */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RatingStars({ value, onChange, size = 'md', className }: RatingStarsProps) {
  const interactive = !!onChange
  const starSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-7 w-7'
  // 편집(lg)은 별 사이 간격을 넓혀 인접 별 오터치 방지
  const gap = size === 'lg' ? 'gap-2' : 'gap-0.5'

  return (
    <div className={cn('flex items-center', gap, className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const star = (
          <Star
            className={cn(
              starSize,
              // 스킬에 별점 전용 색 토큰이 없어 강조색(--s-accent)으로 통일.
              // 채움 별은 accent, 빈 별은 faint 톤(둘 다 토큰 기반, 임의 색 없음).
              filled ? cn('fill-current', styles.accent) : cn('fill-transparent', styles.faint)
            )}
          />
        )
        if (!interactive) return <span key={n}>{star}</span>
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className={cn('transition-transform hover:scale-110', styles.ratingStar)}
            aria-label={`별점 ${n}점`}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
