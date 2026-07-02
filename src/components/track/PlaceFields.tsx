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
import type { PlaceFormValues } from '@/lib/schemas/placeSchema'
import type { MealTime } from '@/types'

const MEAL_OPTIONS = [
  { value: 'lunch' as MealTime, label: '점심' },
  { value: 'dinner' as MealTime, label: '저녁' },
]

interface PlaceFieldsProps {
  register: UseFormRegister<PlaceFormValues>
  errors: FieldErrors<PlaceFormValues>
  watch: UseFormWatch<PlaceFormValues>
  setValue: UseFormSetValue<PlaceFormValues>
}

export function PlaceFields({ register, errors, watch, setValue }: PlaceFieldsProps) {
  const categoryValue = watch('category_id') ?? ''
  const mealTimesValue = watch('meal_times') ?? []

  return (
    <>
      <FormField label="제목" htmlFor="title" required error={errors.title?.message}>
        <Input
          id="title"
          placeholder="장소 이름을 입력해 주세요"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
      </FormField>

      <FormField label="카테고리" error={errors.category_id?.message}>
        <CategorySelect
          track="place"
          value={categoryValue}
          onChange={(v) => setValue('category_id', v)}
        />
      </FormField>

      <FormField label="식사 시간" required error={errors.meal_times?.message as string | undefined}>
        <SegmentedControl
          mode="multi"
          options={MEAL_OPTIONS}
          value={mealTimesValue as MealTime[]}
          onChange={(v) => setValue('meal_times', v as MealTime[], { shouldValidate: true })}
        />
      </FormField>

      <FormField label="지역" htmlFor="area" required error={errors.area?.message}>
        <Input
          id="area"
          placeholder="예: 서울 성수동, 홍대 근처"
          {...register('area')}
          aria-invalid={!!errors.area}
        />
      </FormField>

      <FormField label="위치" htmlFor="location" error={errors.location?.message}>
        <Input
          id="location"
          placeholder="예: 롯데월드, 카페피어라, 서울 성동구 연무장5길 9"
          {...register('location')}
          aria-invalid={!!errors.location}
        />
      </FormField>

      <FormField label="메모" htmlFor="memo" error={errors.memo?.message}>
        <Textarea
          id="memo"
          placeholder="장소에 대한 메모를 남겨보세요"
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
