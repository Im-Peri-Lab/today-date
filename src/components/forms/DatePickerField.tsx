'use client'

import { useRef } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDotDate } from '@/lib/date'
import styles from '@/components/screens.module.css'

interface DatePickerFieldProps {
  id?: string
  /** 저장값 — ISO 'YYYY-MM-DD' 또는 빈 문자열. 표시만 YYYY.MM.DD로 가공하고 값은 그대로 유지 */
  value: string
  onChange: (iso: string) => void
  placeholder?: string
}

/**
 * 방문 날짜 선택기 — 박스/leading 아이콘/표시 텍스트(YYYY.MM.DD)는 우리 디자인 토큰으로 유지하고
 * 달력 팝업만 OS 네이티브(`<input type="date">`)를 쓴다. 네이티브 input은 박스 위에 opacity:0으로
 * 덮어 클릭을 받고(데스크탑은 showPicker로 보강), 보이는 표시는 그 아래 우리 텍스트가 담당한다.
 * input[type=date]의 value/onChange는 ISO('YYYY-MM-DD') 그대로 → 저장값 불변, 타임존 가공 없음.
 */
export function DatePickerField({ id, value, onChange, placeholder = '날짜 선택' }: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // 데스크탑에서 클릭 시 OS 달력을 확실히 띄운다(모바일은 포커스만으로 열림).
  function openPicker() {
    try {
      inputRef.current?.showPicker?.()
    } catch {
      /* showPicker 미지원/제스처 외 호출 — 네이티브 기본 동작에 맡긴다 */
    }
  }

  return (
    <div className={styles.dateTrigger} onClick={openPicker}>
      {/* leading(좌측) Calendar 아이콘 — accent 톤(상세화면 방문일 아이콘과 통일) */}
      <Calendar className={cn('h-4 w-4 shrink-0', styles.accent)} />
      <span className={cn(!value && styles.faint)}>
        {value ? formatDotDate(value) : placeholder}
      </span>
      {/* 박스 전체를 덮는 네이티브 입력 — 보이지 않지만 클릭/포커스를 받아 OS 달력을 연다.
          font-size 16px: iOS 포커스 자동 줌인 방지. color-scheme: 네이티브 달력/indicator 다크 대응. */}
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.dateInput}
        aria-label={placeholder}
      />
    </div>
  )
}
