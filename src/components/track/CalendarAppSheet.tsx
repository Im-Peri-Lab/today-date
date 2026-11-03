'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/forms/SegmentedControl'
import { CALENDAR_APPS, detectDefaultCalendarAppId, type CalendarAppId } from '@/lib/calendar/apps'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export interface CalendarAppSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 기억된 캘린더 — 없으면(최초) 기기에 맞는 앱을 미리 골라 둔다 */
  initialAppId: CalendarAppId | null
  initialPrefix: string
  /** 선택한 캘린더와 머리말을 넘긴다. 저장·실행은 호출부(useCalendarAdd)가 한다. */
  onConfirm: (appId: CalendarAppId, prefix: string) => void
}

/**
 * 캘린더 선택 시트 — 애플/구글 선택 + 제목 머리말(선택). 메인 버튼의 최초 실행과 ▾ 가 공용.
 * PlannedAtDialog 와 같은 박스 호흡·풀폭 Primary 풋터 — 닫기는 상단 X 하나뿐.
 */
export function CalendarAppSheet({
  open,
  onOpenChange,
  initialAppId,
  initialPrefix,
  onConfirm,
}: CalendarAppSheetProps) {
  const [appId, setAppId] = useState<CalendarAppId>(initialAppId ?? 'apple-ics')
  const [prefix, setPrefix] = useState(initialPrefix)

  // 시트가 열릴 때마다 저장된 값으로 동기화(저장값 없으면 기기 기준 기본 앱)
  useEffect(() => {
    if (open) {
      setAppId(initialAppId ?? detectDefaultCalendarAppId())
      setPrefix(initialPrefix)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="px-5 pt-6 pb-5">
        <DialogHeader className="gap-0 mb-1">
          <DialogTitle>캘린더에 추가</DialogTitle>
          <DialogDescription className={styles.pageSubtitle}>
            추가할 캘린더를 골라 주세요. 선택은 기억해 두었다가 다음부터 바로 열어요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <SegmentedControl
            mode="single"
            options={CALENDAR_APPS.map((app) => ({ value: app.id, label: app.label }))}
            value={appId}
            onChange={setAppId}
          />

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
        </div>

        <DialogFooter className="-mx-5 -mb-5 p-5">
          <Button
            onClick={() => onConfirm(appId, prefix)}
            className={cn(styles.detailPrimaryBtn, 'h-10 w-full text-white hover:brightness-105')}
          >
            캘린더에 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
