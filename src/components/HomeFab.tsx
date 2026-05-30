'use client'

import { useRouter } from 'next/navigation'
import { Plus, Sparkles, MapPin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import styles from '@/components/screens.module.css'

/** 우하단 FAB — 클릭 시 활동/장소 추가 메뉴를 위로 펼침 */
export function HomeFab() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={styles.fab} aria-label="추가하기" />}
      >
        <Plus className="h-6 w-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={12}>
        <DropdownMenuItem onClick={() => router.push('/activities/new')}>
          <Sparkles />
          활동 추가
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/places/new')}>
          <MapPin />
          장소 추가
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
