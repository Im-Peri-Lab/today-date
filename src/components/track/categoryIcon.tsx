import { getCategoryIcon } from '@/lib/categoryIcons'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 카테고리명 → lucide 아이콘 렌더링 (화면 표시 전용).
 * DB의 category.icon(이모지) 값은 건드리지 않고, 이름으로만 단색 선 아이콘을 고른다.
 * 필터 칩과 카드 뱃지가 같은 세트를 공유한다. 매핑 자체는 @/lib/categoryIcons 단일 소스.
 */
export function CategoryIcon({
  name,
  className,
  color,
}: {
  name: string
  className?: string
  color?: string
}) {
  const Icon = getCategoryIcon(name)
  return (
    <Icon
      className={cn(styles.catIcon, className)}
      style={color ? { color } : undefined}
      strokeWidth={2}
      aria-hidden
    />
  )
}
