'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCalendarTitlePrefix } from '@/hooks/useCalendarTitlePrefix'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

const PREFIX_MAX_LENGTH = 20

/**
 * 설정 카드 — 캘린더 제목 문구. 닉네임 편집(AccountInfoBlock)과 같은 인라인 편집 규칙:
 * 연필 → 입력 + 우측 정렬 "취소 → 저장". 값이 이 기기 localStorage 에 동기로 저장돼
 * 기다릴 것이 없으므로 "저장 중..." 상태는 없다.
 */
export function CalendarTitlePrefixBlock() {
  const { prefix, setPrefix, markIntroSeen } = useCalendarTitlePrefix()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  function startEdit() {
    setValue(prefix)
    setEditing(true)
  }

  function save() {
    setPrefix(value)
    // 여기서 정했다면 첫 캘린더 추가 때 안내 다이얼로그를 또 보여 줄 이유가 없다.
    markIntroSeen()
    setEditing(false)
    toast.success('수정되었습니다!')
  }

  return (
    <section className={cn(styles.card, styles.detailCard, 'px-5 py-4 lg:px-6 lg:py-5')}>
      <p className={cn('mb-1.5 uppercase tracking-wide', styles.fieldLabel)}>캘린더 제목 문구</p>
      {editing ? (
        <div>
          <Input
            id="calendar-title-prefix"
            type="text"
            autoComplete="off"
            maxLength={PREFIX_MAX_LENGTH}
            placeholder="예: [데이트] "
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <p className={cn('mt-1.5 text-xs', styles.sub)}>
            캘린더에 추가하는 일정 제목 앞에 붙어요. 최대 {PREFIX_MAX_LENGTH}자.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
              className="h-9 px-4 transition-colors"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={save}
              className={cn(
                styles.detailPrimaryBtn,
                'h-9 gap-1.5 px-4 text-white transition-colors hover:brightness-105',
              )}
            >
              저장
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative pr-9">
          <span className={cn('whitespace-pre-wrap break-all', styles.bodyText)}>
            {prefix.trim() ? prefix : <span className={styles.faint}>설정 안 함</span>}
          </span>
          <button
            type="button"
            className={cn(styles.mapActionBtn, 'absolute right-0 top-1/2 -translate-y-1/2')}
            onClick={startEdit}
            aria-label="캘린더 제목 문구 수정"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* 내보내기는 1회성 사본이라 동기화되지 않는다는 안내(021) — 편집/보기 모드 공통 */}
      <p className={cn('mt-3 text-xs', styles.sub)}>
        앱에서 날짜·시간을 바꿔도 이미 추가한 캘린더 일정은 바뀌지 않아요
      </p>
    </section>
  )
}
