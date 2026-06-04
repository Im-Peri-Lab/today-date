import {
  Waves,
  Leaf,
  Drama,
  Sparkles,
  Home,
  Flower2,
  Plane,
  Tag,
  UtensilsCrossed,
  Fish,
  Soup,
  ChefHat,
  Coffee,
  Wine,
  Cake,
  LucideIcon,
} from 'lucide-react'

export const ACTIVITY_CATEGORY_ICONS: Record<string, LucideIcon> = {
  액티비티: Waves,
  자연: Leaf,
  문화: Drama,
  축제: Sparkles,
  실내: Home,
  계절: Flower2,
  여행: Plane,
  미분류: Tag,
}

export const PLACE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  양식: UtensilsCrossed,
  일식: Fish,
  한식: Soup,
  중식: ChefHat,
  카페: Coffee,
  바: Wine,
  디저트: Cake,
  미분류: Tag,
}

export function getCategoryIcon(
  track: 'activity' | 'place',
  name: string
): LucideIcon {
  const map = track === 'activity' ? ACTIVITY_CATEGORY_ICONS : PLACE_CATEGORY_ICONS
  return map[name] ?? Tag
}
