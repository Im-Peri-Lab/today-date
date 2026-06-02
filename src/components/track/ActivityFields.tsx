'use client'

import {
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  { value: 'any' as const, label: '상관없음' },
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
      {/* 제목 */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          제목 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="활동 이름을 입력해 주세요"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      {/* 카테고리 */}
      <div className="space-y-1.5">
        <Label>카테고리</Label>
        <CategorySelect
          track="activity"
          value={categoryValue}
          onChange={(v) => setValue('category_id', v)}
          error={errors.category_id?.message}
        />
      </div>

      {/* 소요시간 */}
      <div className="space-y-2">
        <Label>
          소요시간 <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={[
                'flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-sm text-center transition-colors',
                durationValue === opt.value
                  ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                  : 'border-input text-muted-foreground hover:border-violet-300',
              ].join(' ')}
            >
              <input
                type="radio"
                value={opt.value}
                {...register('duration_bucket')}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.duration_bucket && (
          <p className="text-xs text-red-500">{errors.duration_bucket.message}</p>
        )}
      </div>

      {/* 시간대 */}
      <div className="space-y-2">
        <Label>시간대</Label>
        <div className="flex gap-2">
          {TIME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={[
                'flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-sm text-center transition-colors',
                timeValue === opt.value
                  ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                  : 'border-input text-muted-foreground hover:border-violet-300',
              ].join(' ')}
            >
              <input
                type="radio"
                value={opt.value}
                {...register('time_of_day')}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea
          id="memo"
          placeholder="활동에 대한 메모를 남겨보세요"
          rows={3}
          {...register('memo')}
          aria-invalid={!!errors.memo}
        />
        {errors.memo && <p className="text-xs text-red-500">{errors.memo.message}</p>}
      </div>

      {/* 참고 URL */}
      <div className="space-y-1.5">
        <Label htmlFor="reference_url">참고 URL</Label>
        <Input
          id="reference_url"
          type="url"
          placeholder="https://..."
          {...register('reference_url')}
          aria-invalid={!!errors.reference_url}
        />
        {errors.reference_url && (
          <p className="text-xs text-red-500">{errors.reference_url.message}</p>
        )}
      </div>
    </>
  )
}
