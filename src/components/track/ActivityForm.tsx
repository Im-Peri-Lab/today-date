'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CategorySelect } from '@/components/CategorySelect'
import { useUpdateActivity } from '@/hooks/useActivities'
import { activityFormSchema, type ActivityFormValues } from '@/lib/schemas/activitySchema'
import type { Activity } from '@/types'

type FormValues = ActivityFormValues

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
  const update = useUpdateActivity()
  const isEdit = !!activity
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(activityFormSchema),
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

    if (isEdit) {
      // 수정: useUpdateActivity 훅 사용 (캐시 무효화는 훅 내부에서 처리)
      try {
        await update.mutateAsync({ id: activity!.id, patch: payload })
        toast.success('수정되었습니다! ✏️')
        router.push(`/activities/${activity!.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
      }
    } else {
      // 신규 생성: 기존 fetch 방식 유지
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '저장 중 오류가 발생했습니다.')
        return
      }
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
