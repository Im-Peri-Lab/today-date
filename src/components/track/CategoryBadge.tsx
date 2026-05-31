import { CategoryIcon } from './categoryIcon'
import styles from '@/components/screens.module.css'

interface CategoryLike {
  name: string
  icon: string | null
  color: string | null
}

export function CategoryBadge({ category }: { category?: CategoryLike | null }) {
  if (!category) return null

  // 배경/글씨는 중성(라벨), 카테고리 구분은 아이콘 색으로만.
  return (
    <span className={styles.labelBadge}>
      <CategoryIcon
        name={category.name}
        className="h-3.5 w-3.5"
        color={category.color ?? undefined}
      />
      {category.name}
    </span>
  )
}
