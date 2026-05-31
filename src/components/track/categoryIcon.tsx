import {
  Waves,
  Leaf,
  Drama,
  PartyPopper,
  Home,
  Sprout,
  Plane,
  Pin,
  Utensils,
  Fish,
  Soup,
  CookingPot,
  Coffee,
  Martini,
  Cake,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 카테고리명 → lucide 아이콘 매핑 (화면 표시 전용).
 * DB의 category.icon(이모지) 값은 건드리지 않고, 이름으로만 단색 선 아이콘을 고른다.
 * 필터 칩과 카드 뱃지가 같은 세트를 공유한다.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // 활동
  액티비티: Waves,
  자연: Leaf,
  문화: Drama,
  축제: PartyPopper,
  실내: Home,
  계절: Sprout,
  여행: Plane,
  // 장소
  양식: Utensils,
  일식: Fish,
  한식: Soup,
  중식: CookingPot,
  카페: Coffee,
  바: Martini,
  디저트: Cake,
  // 공통
  미분류: Pin,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Tag
  return <Icon className={cn(styles.catIcon, className)} strokeWidth={1.75} aria-hidden />
}
