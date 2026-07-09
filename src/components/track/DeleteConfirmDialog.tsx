'use client'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  loading?: boolean
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  loading,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 결정 다이얼로그 → 닫기 수단은 하단 "취소" 하나만(스킬 다이얼로그 §, iOS Action Sheet 표준:
          삭제·취소 두 결정 명시). 상단 X는 제거(showCloseButton={false}). */}
      <DialogContent className="max-w-xs" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>삭제할까요?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-[color:var(--s-ink,#1a1033)]">{title}</span>
            {'  '}항목을 삭제하면 되돌릴 수 없어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="h-9" disabled={loading} />}>취소</DialogClose>
          <Button variant="destructive" className="h-9" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
