'use client'

import { useRef } from 'react'
import { Clock, X } from 'lucide-react'
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
}

/**
 * 방문 예정 시작 시간(021) — 방문 예정일 필드 바로 아래, 날짜가 있으면 항상 노출(PlannedAtDialog·`/new` 공용).
 * 화면 라벨 없이("방문 예정일" 라벨 아래 날짜 박스와 8px 간격 한 묶음, 입력의 aria-label="시간 (선택)") DatePickerField 와 같은 박스(.dateTrigger, 높이 고정 40px — 빈 time 입력이 iOS 에서
 * 납작해져도 박스 높이는 그대로) + 네이티브 `<input type="time" step="600">` 덮개 + 보조 문구.
 * 비어 있으면 종일, × 는 값이 있을 때만 보이고 누르면 빈 값(=종일)으로 되돌린다. 미리 채우기 없음.
 * step 은 iOS 휠에서 무시된다(1분 단위).
 */
export function PlannedTimeField({ id, value, onChange, hasDate }: PlannedTimeFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (!hasDate) return null

  function openPicker() {
    try {
      inputRef.current?.showPicker?.()
    } catch {
      /* showPicker 미지원/제스처 외 호출 — 네이티브 기본 동작에 맡긴다 */
    }
  }

  return (
    // 날짜 박스와 한 묶음(간격 8px): 부모(FormField·다이얼로그)의 space-y-1.5 가 margin-top 6px 을 주고
    // padding 2px 을 더한다(margin 은 부모가 덮어써서 padding 으로). 화면 라벨은 없고 접근성 이름만 둔다.
    <div className="space-y-1.5 pt-0.5">
      <div className={styles.dateTrigger} onClick={openPicker}>
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
          aria-label="시간 (선택)"
        />
        {value && (
          <button
            type="button"
            className={styles.dateClear}
            aria-label="시간 지우기"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className={cn('text-xs', styles.sub)}>비워두면 종일 일정으로 추가돼요</p>
    </div>
  )
}
