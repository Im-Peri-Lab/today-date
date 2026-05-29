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
import type { Activity } from '@/types'

const schema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하로 입력해 주세요.'),
  category_id: z.string().optional(),
  duration_bucket: z.enum(['half', 'full', 'overnight'], {
    error: '소요시간을 선택해 주세요.',
  }),
  time_of_day: z.enum(['day', 'night', 'any']),
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

const DURATION_OPTIONS = [
  { value: 'half', label: '반나절' },
  { value: 'full', label: '하루' },
  { value: 'overnight', label: '1박 이상' },
] as const

const TIME_OPTIONS = [
  { value: 'day', label: '주간' },
  { value: 'night', label: '야간' },
  { value: 'any', label: '상관없음' },
] as const

export function ActivityForm({ activity }: { activity?: Activity }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!activity
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: activity
      ? {
          title: activity.title,
          category_id: activity.category_id ?? '',
          duration_bucket: activity.duration_bucket ?? undefined,
          time_of_day: activity.time_of_day,
          memo: activity.memo ?? '',
          reference_url: activity.reference_url ?? '',
        }
      : { time_of_day: 'any' },
  })

  const durationValue = watch('duration_bucket')
  const timeValue = watch('time_of_day')
  const categoryValue = watch('category_id') ?? ''

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      memo: values.memo || null,
      added_by: values.added_by || null,
    }

    const res = await fetch(isEdit ? `/api/activities/${activity!.id}` : '/api/activities', {
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
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activity', activity!.id] })
      toast.success('수정되었습니다! ✏️')
      router.push(`/activities/${activity!.id}`)
    } else {
      toast.success('활동이 등록되었습니다! 🎉')
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        {isSubmitting ? '저장 중...' : isEdit ? '수정 저장하기' : '활동 등록하기'}
      </Button>
    </form>
  )
}
