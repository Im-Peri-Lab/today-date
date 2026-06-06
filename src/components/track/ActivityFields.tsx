'use client'

import {
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/forms/FormField'
import { SegmentedControl } from '@/components/forms/SegmentedControl'
import { CategorySelect } from '@/components/CategorySelect'
import type { ActivityFormValues } from '@/lib/schemas/activitySchema'

const DURATION_OPTIONS = [
  { value: 'half' as const, label: '반나절' },
  { value: 'full' as const, label: '하루' },
  { value: 'overnight' as const, label: '1박 이상' },
]

const TIME_OPTIONS = [
  { value: 'day' as const, label: '주간' },
  { value: 'night' as const, label: '야간' },
  { value: 'any' as const, label: '아무때나' },
]

interface ActivityFieldsProps {
  register: UseFormRegister<ActivityFormValues>
  errors: FieldErrors<ActivityFormValues>
  watch: UseFormWatch<ActivityFormValues>
  setValue: UseFormSetValue<ActivityFormValues>
}

export function ActivityFields({ register, errors, watch, setValue }: ActivityFieldsProps) {
  const durationValue = watch('duration_bucket')
  const timeValue = watch('time_of_day')
  const categoryValue = watch('category_id') ?? ''

  return (
    <>
      <FormField label="제목" htmlFor="title" required error={errors.title?.message}>
        <Input
          id="title"
          placeholder="활동 이름을 입력해 주세요"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
      </FormField>

      <FormField label="카테고리" error={errors.category_id?.message}>
        <CategorySelect
          track="activity"
          value={categoryValue}
          onChange={(v) => setValue('category_id', v)}
        />
      </FormField>

      <FormField label="소요시간" required error={errors.duration_bucket?.message}>
        <SegmentedControl
          mode="single"
          options={DURATION_OPTIONS}
          value={durationValue}
          onChange={(v) => setValue('duration_bucket', v, { shouldValidate: true })}
        />
      </FormField>

      <FormField label="시간대" error={errors.time_of_day?.message}>
        <SegmentedControl
          mode="single"
          options={TIME_OPTIONS}
          value={timeValue}
          onChange={(v) => setValue('time_of_day', v, { shouldValidate: true })}
        />
      </FormField>

      <FormField label="메모" htmlFor="memo" error={errors.memo?.message}>
        <Textarea
          id="memo"
          placeholder="활동에 대한 메모를 남겨보세요"
          rows={3}
          {...register('memo')}
          aria-invalid={!!errors.memo}
        />
      </FormField>

      <FormField label="참고 URL" htmlFor="reference_url" error={errors.reference_url?.message}>
        <Input
          id="reference_url"
          type="url"
          placeholder="https://..."
          {...register('reference_url')}
          aria-invalid={!!errors.reference_url}
        />
      </FormField>
    </>
  )
}
