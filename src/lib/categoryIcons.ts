import {
  Waves,
  Puzzle,
  Drama,
  PartyPopper,
  Leaf,
  Plane,
  Utensils,
  Fish,
  Soup,
  CookingPot,
  Coffee,
  Martini,
  Cake,
  Pin,
  Tag,
  type LucideIcon,
} from 'lucide-react'

/**
 * 카테고리명(한글) → lucide 아이콘 단일 매핑.
 * 이전에는 forms/categoryIcons.ts와 track/categoryIcon.tsx에 동일 목적의 맵이
 * 중복 유지되며 서로 값이 어긋나 있었다(예: 축제 Sparkles vs PartyPopper).
 * 통합 시 두 맵이 갈린 항목은 화면 사용처가 더 넓고 SKILL.md가 기준으로 지목하던
 * track/categoryIcon.tsx 쪽 값을 채택했다: 축제=PartyPopper, 양식=Utensils,
 * 중식=CookingPot, 바=Martini, 미분류=Pin.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // 활동
  레저: Waves,
  체험: Puzzle,
  문화: Drama,
  축제: PartyPopper,
  자연: Leaf,
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

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Tag
}
