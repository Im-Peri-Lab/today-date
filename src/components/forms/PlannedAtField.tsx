'use client'

import { X } from 'lucide-react'
import { FormField } from './FormField'
import { DatePickerField } from './DatePickerField'
import styles from '@/components/screens.module.css'

interface PlannedAtFieldProps {
  /** ISO 'YYYY-MM-DD' 또는 빈 문자열(미정) */
  value: string
  onChange: (iso: string) => void
  error?: string
}

/**
 * 방문 예정일 입력 — 위시리스트 전용 선택 필드(활동·다이닝 폼과 상세 인라인 편집 공용).
 * 입력은 방문일과 같은 DatePickerField(네이티브 date). iOS 네이티브 달력엔 값을 비우는 수단이
 * 없어 값이 있을 때만 "지우기"(기존 resetBtn)를 옆에 둔다.
 */
export function PlannedAtField({ value, onChange, error }: PlannedAtFieldProps) {
  return (
    <FormField label="방문 예정일" htmlFor="planned_at" error={error}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <DatePickerField
            id="planned_at"
            value={value}
            onChange={onChange}
            placeholder="가기로 한 날짜 (선택)"
          />
        </div>
        {value && (
          <button type="button" onClick={() => onChange('')} className={styles.resetBtn}>
            <X className="h-3.5 w-3.5" />
            지우기
          </button>
        )}
      </div>
    </FormField>
  )
}
