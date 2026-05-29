'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CategorySelect } from '@/components/CategorySelect'
import type { Place } from '@/types'

const schema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하로 입력해 주세요.'),
  category_id: z.string().optional(),
  location: z.string().min(1, '위치를 입력해 주세요.'),
  meal_times: z
    .array(z.enum(['lunch', 'dinner']))
    .min(1, '식사 시간을 하나 이상 선택해 주세요.')
    .max(2),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해 주세요.').optional(),
  reference_url: z
    .string()
    .optional()
    .refine((v) => !v || v === '' || /^https?:\/\/.+/.test(v), {
      message: '올바른 URL 형식이 아닙니다. (http:// 또는 https://로 시작)',
    }),
  added_by: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const MEAL_OPTIONS = [
  { value: 'lunch' as const, label: '점심' },
  { value: 'dinner' as const, label: '저녁' },
]

export function PlaceForm({ place }: { place?: Place }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!place
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: place
      ? {
          title: place.title,
          category_id: place.category_id ?? '',
          location: place.location,
          meal_times: place.meal_times,
          memo: place.memo ?? '',
          reference_url: place.reference_url ?? '',
        }
      : { meal_times: [] },
  })

  const categoryValue = watch('category_id') ?? ''
  const mealTimesValue = watch('meal_times') ?? []

  function toggleMealTime(value: 'lunch' | 'dinner') {
    const current = mealTimesValue
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setValue('meal_times', next, { shouldValidate: true })
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      memo: values.memo || null,
      added_by: values.added_by || null,
    }

    const res = await fetch(isEdit ? `/api/places/${place!.id}` : '/api/places', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? '저장 중 오류가 발생했습니다.')
      return
    }

    if (isEdit) {
      queryClient.invalidateQueries({ queryKey: ['places'] })
      queryClient.invalidateQueries({ queryKey: ['place', place!.id] })
      toast.success('수정되었습니다! ✏️')
      router.push(`/places/${place!.id}`)
    } else {
      toast.success('장소가 등록되었습니다! 📍')
      router.push('/list')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* 제목 */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          제목 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="장소 이름을 입력해 주세요"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      {/* 카테고리 */}
      <div className="space-y-1.5">
        <Label>카테고리</Label>
        <CategorySelect
          track="place"
          value={categoryValue}
          onChange={(v) => setValue('category_id', v)}
          error={errors.category_id?.message}
        />
      </div>

      {/* 위치 */}
      <div className="space-y-1.5">
        <Label htmlFor="location">
          위치 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="location"
          placeholder="예: 서울 성수동, 홍대 근처"
          {...register('location')}
          aria-invalid={!!errors.location}
        />
        {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
      </div>

      {/* 식사 시간 */}
      <div className="space-y-2">
        <Label>
          식사 시간 <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-3">
          {MEAL_OPTIONS.map((opt) => {
            const checked = mealTimesValue.includes(opt.value)
            return (
              <label
                key={opt.value}
                className={[
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors',
                  checked
                    ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                    : 'border-input text-muted-foreground hover:border-violet-300',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMealTime(opt.value)}
                  className="sr-only"
                />
                <span
                  className={[
                    'flex h-4 w-4 items-center justify-center rounded border',
                    checked ? 'border-violet-500 bg-violet-500' : 'border-gray-300',
                  ].join(' ')}
                >
                  {checked && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1.5 5L4 7.5L8.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {opt.label}
              </label>
            )
          })}
        </div>
        {errors.meal_times && (
          <p className="text-xs text-red-500">{errors.meal_times.message}</p>
        )}
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea
          id="memo"
          placeholder="장소에 대한 메모를 남겨보세요"
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        {isSubmitting ? '저장 중...' : isEdit ? '수정 저장하기' : '장소 등록하기'}
      </Button>
    </form>
  )
}
