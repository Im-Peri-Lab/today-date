'use client'

import { FormField } from './FormField'
import { DatePickerField } from './DatePickerField'
import { PlannedTimeField } from './PlannedTimeField'

interface PlannedAtFieldProps {
  /** ISO 'YYYY-MM-DD' 또는 빈 문자열(미정) */
  value: string
  onChange: (iso: string) => void
  /** 방문 예정 시작 시간 'HH:mm' 또는 빈 문자열(종일, 021) */
  timeValue: string
  onTimeChange: (hhmm: string) => void
  error?: string
}

/**
 * 방문 예정일 입력 — 위시리스트 전용 선택 필드(`/new` 등록 폼 전용).
 * 입력은 방문일과 같은 DatePickerField(네이티브 date). iOS 네이티브 달력엔 값을 비우는 수단이
 * 없어 값이 있을 때 박스 우측 끝에 X 아이콘(onClear)을 둔다.
 * 날짜가 있으면 아래에 "시간 (선택)" 칸(PlannedTimeField)이 바로 보이고, 날짜를 지우면 시간도 함께 지운다(021).
 */
export function PlannedAtField({
  value,
  onChange,
  timeValue,
  onTimeChange,
  error,
}: PlannedAtFieldProps) {
  function changeDate(iso: string) {
    onChange(iso)
    if (!iso) onTimeChange('')
  }

  return (
    <FormField label="방문 예정일" htmlFor="planned_at" error={error}>
      <DatePickerField
        id="planned_at"
        value={value}
        onChange={changeDate}
        onClear={() => changeDate('')}
        placeholder="날짜 선택"
      />
      <PlannedTimeField
        id="planned_time"
        value={timeValue}
        onChange={onTimeChange}
        hasDate={Boolean(value)}
      />
    </FormField>
  )
}
