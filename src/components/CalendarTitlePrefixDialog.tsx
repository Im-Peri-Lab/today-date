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
  /** 캘린더 추가 중에 끼어든 안내(첫 실행)일 때 true — 닫으면 추가가 이어진다고 알려 준다 */
  continuing?: boolean
}

/**
 * 캘린더 일정 제목 머리말 설정 — 홈 삼선 메뉴(HomeMenu)와 첫 캘린더 추가가 공용.
 * 입력은 자동 저장(별도 저장 버튼 없음)이고 닫기는 상단 X 하나뿐(입력 폼 다이얼로그 규칙).
 * 어느 진입점에서든 닫으면 "이미 봤음"을 남겨, 첫 캘린더 추가 때 이 다이얼로그가 다시 끼어들지 않는다.
 */
export function CalendarTitlePrefixDialog({
  open,
  onOpenChange,
  continuing = false,
}: CalendarTitlePrefixDialogProps) {
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
            캘린더에 추가하는 일정 제목 앞에 붙일 문구예요. 입력하면 자동으로 저장돼요.
            {continuing && ' 닫으면 캘린더 추가를 이어서 진행해요.'}
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
