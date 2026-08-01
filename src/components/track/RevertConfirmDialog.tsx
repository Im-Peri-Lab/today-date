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
}

export function RevertConfirmDialog({
  open,
  onOpenChange,
  loading,
  onConfirm,
}: RevertConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>가보고 싶은 곳으로 되돌릴까요?</DialogTitle>
          <DialogDescription>
            방문일, 별점, 후기가 모두 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="h-9" disabled={loading} />}>
            취소
          </DialogClose>
          <Button className="h-9" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? '처리 중...' : '되돌리기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
