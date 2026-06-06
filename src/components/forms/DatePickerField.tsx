'use client'

import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatKoreanDate } from '@/lib/date'
import styles from '@/components/screens.module.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

interface DatePickerFieldProps {
  id?: string
  /** 저장값 — ISO 'YYYY-MM-DD' 또는 빈 문자열. 표시만 한글로 가공하고 값은 그대로 유지 */
  value: string
  onChange: (iso: string) => void
  placeholder?: string
}

/**
 * 방문 날짜 선택기 — 외형은 다른 입력바와 동일(styles.dateTrigger), 클릭 시 토큰 기반 달력 팝오버.
 * 날짜 비교·생성은 문자열/숫자로만 처리해 new Date(iso)의 UTC 자정 밀림을 피한다
 * (lib/date.ts 와 동일한 타임존 안전 원칙). 저장값은 항상 ISO.
 */
export function DatePickerField({ id, value, onChange, placeholder = '날짜 선택' }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? value.split('-').map(Number) : null // [y, m, d]
  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  const [viewY, setViewY] = useState(selected ? selected[0] : todayY)
  const [viewM, setViewM] = useState(selected ? selected[1] : todayM) // 1-12

  // 연/월/일 인자로 만든 로컬 Date는 타임존 안전(문자열 파싱 아님)
  const firstWeekday = new Date(viewY, viewM - 1, 1).getDay() // 0(일)~6(토)
  const daysInMonth = new Date(viewY, viewM, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function prevMonth() {
    if (viewM === 1) {
      setViewY(viewY - 1)
      setViewM(12)
    } else setViewM(viewM - 1)
  }
  function nextMonth() {
    if (viewM === 12) {
      setViewY(viewY + 1)
      setViewM(1)
    } else setViewM(viewM + 1)
  }
  function pick(d: number) {
    onChange(toISO(viewY, viewM, d))
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger id={id} className={styles.dateTrigger}>
        <span className={cn(!value && styles.faint)}>
          {value ? formatKoreanDate(value) : placeholder}
        </span>
        <Calendar className={cn('h-4 w-4 shrink-0', styles.faint)} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start">
          <Popover.Popup className={styles.dpPopup}>
            <div className={styles.dpHeader}>
              <button type="button" className={styles.dpNav} onClick={prevMonth} aria-label="이전 달">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className={cn('text-sm font-medium', styles.ink)}>
                {viewY}년 {viewM}월
              </span>
              <button type="button" className={styles.dpNav} onClick={nextMonth} aria-label="다음 달">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className={styles.dpGrid}>
              {WEEKDAYS.map((w) => (
                <span key={w} className={styles.dpWeekday}>
                  {w}
                </span>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <span key={`e${i}`} />
                const isSelected =
                  !!selected && selected[0] === viewY && selected[1] === viewM && selected[2] === d
                const isToday = todayY === viewY && todayM === viewM && todayD === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => pick(d)}
                    className={cn(
                      styles.dpDay,
                      isSelected && styles.dpDaySelected,
                      !isSelected && isToday && styles.dpDayToday
                    )}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
