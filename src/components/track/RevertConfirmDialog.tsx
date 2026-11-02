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

interface RevertConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading?: boolean
  onConfirm: () => void
  /** 기본값은 '다녀온 곳 → 가보고 싶은 곳' 되돌리기 문구. 다른 되돌리기(예: 방문 예정일)에서 덮어쓴다 */
  title?: string
  description?: string
  confirmLabel?: string
}

export function RevertConfirmDialog({
  open,
  onOpenChange,
  loading,
  onConfirm,
  title = '가보고 싶은 곳으로 되돌릴까요?',
  description = '방문기록(방문일, 별점, 후기)이 모두 삭제됩니다.',
  confirmLabel = '되돌리기',
}: RevertConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="h-9" disabled={loading} />}>
            취소
          </DialogClose>
          <Button className="h-9" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? '처리 중...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
