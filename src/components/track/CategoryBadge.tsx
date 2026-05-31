import { CategoryIcon } from './categoryIcon'

interface CategoryLike {
  name: string
  icon: string | null
  color: string | null
}

export function CategoryBadge({ category }: { category?: CategoryLike | null }) {
  if (!category) return null
  const color = category.color ?? '#9E9E9E'

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <CategoryIcon name={category.name} className="h-3.5 w-3.5" />
      {category.name}
    </span>
  )
}
