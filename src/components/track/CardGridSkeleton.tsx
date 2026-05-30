import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(styles.card, 'p-4')}>
          <div className={cn('mb-3 h-5 w-2/3 animate-pulse', styles.skelBar)} />
          <div className={cn('mb-2 h-4 w-1/3 animate-pulse', styles.skelBar)} />
          <div className={cn('h-4 w-full animate-pulse', styles.skelBar)} />
          <div className={cn('mt-1.5 h-4 w-4/5 animate-pulse', styles.skelBar)} />
        </div>
      ))}
    </div>
  )
}
