'use client'

import { MoreVertical, Pencil, Trash2, CheckCircle2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Status } from '@/types'

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
        render={
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 text-muted-foreground hover:text-foreground"
            aria-label="더보기"
          />
        }
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
            위시리스트로 옮기기
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
