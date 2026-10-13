'use client'

import { MoreVertical, Pencil, CalendarCheck, Copy, Trash2, CheckCircle2, Undo2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { STATUS_MENU_LABELS } from '@/lib/labels'
import type { Status } from '@/types'
import styles from '@/components/screens.module.css'

interface ItemMenuProps {
  status: Status
  /** 정보 수정 → 상세의 등록 정보 블록을 편집모드로 연다 */
  onEditInfo: () => void
  /** 기록 수정 → 상세의 방문 기록 블록을 편집모드로 연다 (다녀온 곳 전용) */
  onEditVisit: () => void
  /** 복사하기 → 등록 정보만 prefill 한 신규 폼으로 이동 (DB 즉시 생성 없음) */
  onDuplicate: () => void
  onDelete: () => void
  onMarkVisited: () => void
  onRevert: () => void
}

export function ItemMenu({
  status,
  onEditInfo,
  onEditVisit,
  onDuplicate,
  onDelete,
  onMarkVisited,
  onRevert,
}: ItemMenuProps) {
  const isVisited = status === 'visited'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={styles.iconBtn} aria-label="더보기" />}
      >
        <MoreVertical className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onEditInfo}>
          <Pencil />
          정보 수정
        </DropdownMenuItem>
        {/* 기록 수정은 방문 기록이 있는 '다녀온 곳'에서만 노출 */}
        {isVisited && (
          <DropdownMenuItem onClick={onEditVisit}>
            <CalendarCheck />
            기록 수정
          </DropdownMenuItem>
        )}
        {/* 복사하기 — 정보/기록 수정과 같은 편집·생성 계열, 상태 변경보다 위 */}
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy />
          복사하기
        </DropdownMenuItem>
        {isVisited ? (
          <DropdownMenuItem onClick={onRevert}>
            <Undo2 />
            {STATUS_MENU_LABELS.wishlist}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onMarkVisited}>
            <CheckCircle2 />
            {STATUS_MENU_LABELS.visited}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
