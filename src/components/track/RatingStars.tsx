import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  className?: string
}

export function RatingStars({ value, onChange, size = 'md', className }: RatingStarsProps) {
  const interactive = !!onChange
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-7 w-7'

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const star = (
          <Star
            className={cn(
              starSize,
              filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300'
            )}
          />
        )
        if (!interactive) return <span key={n}>{star}</span>
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className="transition-transform hover:scale-110"
            aria-label={`별점 ${n}점`}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
