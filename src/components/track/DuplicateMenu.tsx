'use client'

import { MoreVertical, Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import styles from '@/components/screens.module.css'

/**
 * 상세 화면 상단의 ⋮ 액션 메뉴 (카드 ItemMenu 와 동일한 DropdownMenu + iconBtn 패턴 재사용).
 * "복사하기"는 삭제보다 위험도가 낮은 일반 액션이라 destructive 구분선 없이 단독 항목으로 둔다.
 */
export function DuplicateMenu({ onDuplicate }: { onDuplicate: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={styles.iconBtn} aria-label="더보기" />}
      >
        <MoreVertical className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy />
          복사하기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
