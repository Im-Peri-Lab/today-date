'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCalendarTitlePrefix } from '@/hooks/useCalendarTitlePrefix'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

const PREFIX_MAX_LENGTH = 20

interface CalendarTitlePrefixDialogProps {
  open: boolean
  /** 끝난 뒤 이번 캘린더 추가에 쓸 문구 — 저장이면 입력한 문구, 취소(X·Esc·바깥 탭 포함)면 빈 문자열 */
  onResolve: (titlePrefix: string) => void
}

/**
 * 첫 캘린더 추가 직전에 한 번 뜨는 머리말 안내. 버튼은 /settings 인라인 편집과 같은 "취소 · 저장"
 * (우측 정렬, 취소 → 저장 순서, 기기 저장이라 "저장 중..." 없음). 버튼은 **문구를 저장할지 말지**만 정하고
 * 캘린더 추가는 어느 쪽이든 이어서 진행한다(useCalendarAdd) — 저장이면 그 문구로, 취소면 문구 없이.
 * X·Esc·바깥 탭은 취소와 같다. 입력 중인 값은 이 다이얼로그가 따로 들고 있다가 저장할 때만 반영한다.
 * 어떻게 끝나든 "이미 봤음"을 남겨 다시 띄우지 않는다. 이후 변경은 설정 화면(/settings)에서 한다.
 */
export function CalendarTitlePrefixDialog({ open, onResolve }: CalendarTitlePrefixDialogProps) {
  const { setPrefix, markIntroSeen } = useCalendarTitlePrefix()
  const [draft, setDraft] = useState('')

  // 열릴 때마다 빈 입력에서 시작(이 다이얼로그는 문구가 아직 없을 때만 뜬다)
  useEffect(() => {
    if (open) setDraft('')
  }, [open])

  function save() {
    setPrefix(draft)
    markIntroSeen()
    onResolve(draft)
  }

  function cancel() {
    markIntroSeen()
    onResolve('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // X·Esc·바깥 탭 = 취소
        if (!next) cancel()
      }}
    >
      <DialogContent className="px-5 pt-6 pb-5">
        <DialogHeader className="gap-0 mb-1">
          <DialogTitle>캘린더 제목 문구</DialogTitle>
          <DialogDescription className={styles.pageSubtitle}>
            캘린더에 추가하는 일정 제목 앞에 붙일 문구예요. 나중에 설정에서 바꿀 수 있어요. 저장하든 취소하든
            캘린더 추가는 이어서 진행해요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="calendar_title_prefix">제목 앞에 붙일 문구 (선택)</Label>
          <Input
            id="calendar_title_prefix"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={PREFIX_MAX_LENGTH}
            placeholder="예: [데이트] "
            autoComplete="off"
          />
        </div>

        {/* /settings 인라인 편집과 같은 액션 — 우측 정렬, 취소 → 저장 */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={cancel} className="h-9 px-4 transition-colors">
            취소
          </Button>
          <Button
            type="button"
            onClick={save}
            className={cn(styles.detailPrimaryBtn, 'h-9 gap-1.5 px-4 text-white transition-colors hover:brightness-105')}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
