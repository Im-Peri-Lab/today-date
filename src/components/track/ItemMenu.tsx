'use client'

import { MoreVertical, Pencil, Trash2, CheckCircle2, Undo2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Status } from '@/types'
import styles from '@/components/screens.module.css'

interface ItemMenuProps {
  status: Status
  onEdit: () => void
  onDelete: () => void
  onMarkVisited: () => void
  onRevert: () => void
}

export function ItemMenu({ status, onEdit, onDelete, onMarkVisited, onRevert }: ItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={styles.iconBtn} aria-label="더보기" />}
      >
        <MoreVertical className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil />
          수정
        </DropdownMenuItem>
        {status === 'visited' ? (
          <DropdownMenuItem onClick={onRevert}>
            <Undo2 />
            위시리스트로
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onMarkVisited}>
            <CheckCircle2 />
            다녀왔어요
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
