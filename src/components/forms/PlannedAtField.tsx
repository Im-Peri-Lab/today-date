'use client'

import { FormField } from './FormField'
import { DatePickerField } from './DatePickerField'

interface PlannedAtFieldProps {
  /** ISO 'YYYY-MM-DD' 또는 빈 문자열(미정) */
  value: string
  onChange: (iso: string) => void
  error?: string
}

/**
 * 방문 예정일 입력 — 위시리스트 전용 선택 필드(`/new` 등록 폼 전용).
 * 입력은 방문일과 같은 DatePickerField(네이티브 date). iOS 네이티브 달력엔 값을 비우는 수단이
 * 없어 값이 있을 때 박스 우측 끝에 X 아이콘(onClear)을 둔다.
 */
export function PlannedAtField({ value, onChange, error }: PlannedAtFieldProps) {
  return (
    <FormField label="방문 예정일" htmlFor="planned_at" error={error}>
      <DatePickerField
        id="planned_at"
        value={value}
        onChange={onChange}
        onClear={() => onChange('')}
        placeholder="가기로 한 날짜 (선택)"
      />
    </FormField>
  )
}
