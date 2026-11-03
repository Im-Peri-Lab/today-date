'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Plus, X } from 'lucide-react'
import { formatKoreanTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface PlannedTimeFieldProps {
  id: string
  /** 'HH:mm' 또는 빈 문자열(종일) */
  value: string
  onChange: (hhmm: string) => void
  /** 방문 예정일이 있어야 시간을 붙일 수 있다 — 없으면 아무것도 렌더하지 않는다 */
  hasDate: boolean
  /** "+ 시간 추가" 탭 시 미리 채울 값(defaultPlannedTime). 빈 값이면 비운 채로 펼친다 */
  prefill?: string
}

/**
 * 방문 예정 시작 시간(021) — 방문 예정일 필드 바로 아래에 둔다(PlannedAtDialog·`/new` 폼 공용).
 * 접힘: "+ 시간 추가" 텍스트 버튼(.textLink). 펼침: DatePickerField 와 같은 박스(.dateTrigger) +
 * 네이티브 `<input type="time" step="600">` 덮개 + × (지우면 종일로 돌아가며 다시 접힌다).
 * 기존 값이 있으면 펼친 상태로 시작. 토글 스위치·타입별 별도 UI 없음. step 은 iOS 휠에서 무시된다(1분 단위).
 */
export function PlannedTimeField({ id, value, onChange, hasDate, prefill = '' }: PlannedTimeFieldProps) {
  const [expanded, setExpanded] = useState(Boolean(value))
  const inputRef = useRef<HTMLInputElement>(null)

  // 바깥에서 값이 채워지면(다이얼로그 재오픈·복사 prefill) 펼친 상태를 따라간다.
  useEffect(() => {
    if (value) setExpanded(true)
  }, [value])

  // 날짜가 지워지면(폼 reset·날짜 X) 다시 접는다 — 다음에 날짜를 고르면 "+ 시간 추가"부터.
  useEffect(() => {
    if (!hasDate) setExpanded(false)
  }, [hasDate])

  if (!hasDate) return null

  if (!expanded) {
    return (
      <button
        type="button"
        className={cn('mt-2 inline-flex items-center gap-1 text-sm', styles.textLink)}
        onClick={() => {
          setExpanded(true)
          onChange(prefill)
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        시간 추가
      </button>
    )
  }

  function openPicker() {
    try {
      inputRef.current?.showPicker?.()
    } catch {
      /* showPicker 미지원/제스처 외 호출 — 네이티브 기본 동작에 맡긴다 */
    }
  }

  return (
    <div className={cn('mt-2', styles.dateTrigger)} onClick={openPicker}>
      <Clock className={cn('h-4 w-4 shrink-0', styles.accent)} />
      <span className={cn(!value && styles.faint)}>{value ? formatKoreanTime(value) : '시간 선택'}</span>
      <input
        ref={inputRef}
        id={id}
        type="time"
        step={600}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.dateInput}
        aria-label="방문 예정 시간"
      />
      <button
        type="button"
        className={styles.dateClear}
        aria-label="시간 지우기"
        onClick={(e) => {
          e.stopPropagation()
          onChange('')
          setExpanded(false)
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
