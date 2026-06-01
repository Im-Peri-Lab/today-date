import { CategoryIcon } from './categoryIcon'
import styles from '@/components/screens.module.css'

interface CategoryLike {
  name: string
  icon: string | null
  color: string | null
}

export function CategoryBadge({ category }: { category?: CategoryLike | null }) {
  if (!category) return null

  // 배경/글씨는 중성(라벨), 아이콘은 필터 칩과 동일한 보라 톤. 카테고리 구분은 텍스트로.
  return (
    <span className={styles.labelBadge}>
      <CategoryIcon name={category.name} className="h-3.5 w-3.5" />
      {category.name}
    </span>
  )
}
