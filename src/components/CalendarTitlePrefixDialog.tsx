'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCalendarTitlePrefix } from '@/hooks/useCalendarTitlePrefix'
import styles from '@/components/screens.module.css'

interface CalendarTitlePrefixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 첫 캘린더 추가 직전에 한 번 뜨는 머리말 안내 — 닫으면 보류한 캘린더 추가가 이어진다(useCalendarAdd).
 * 입력은 자동 저장(별도 저장 버튼 없음)이고 닫기는 상단 X 하나뿐(입력 폼 다이얼로그 규칙).
 * 닫으면 "이미 봤음"을 남겨 다시 끼어들지 않는다. 이후 변경은 설정 화면(/settings)에서 한다.
 */
export function CalendarTitlePrefixDialog({ open, onOpenChange }: CalendarTitlePrefixDialogProps) {
  const { prefix, setPrefix, markIntroSeen } = useCalendarTitlePrefix()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) markIntroSeen()
        onOpenChange(next)
      }}
    >
      <DialogContent className="px-5 pt-6 pb-5">
        <DialogHeader className="gap-0 mb-1">
          <DialogTitle>캘린더 제목 문구</DialogTitle>
          <DialogDescription className={styles.pageSubtitle}>
            캘린더에 추가하는 일정 제목 앞에 붙일 문구예요. 입력하면 자동으로 저장되고, 나중에 설정에서
            바꿀 수 있어요. 닫으면 캘린더 추가를 이어서 진행해요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="calendar_title_prefix">제목 앞에 붙일 문구 (선택)</Label>
          <Input
            id="calendar_title_prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="예: [데이트] "
            autoComplete="off"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
