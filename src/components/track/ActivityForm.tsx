'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ActivityFields } from './ActivityFields'
import { useUpdateActivity } from '@/hooks/useActivities'
import { activityFormSchema, type ActivityFormValues } from '@/lib/schemas/activitySchema'
import type { Activity } from '@/types'

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
  } = useForm<ActivityFormValues>({
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

  async function onSubmit(values: ActivityFormValues) {
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
      <ActivityFields register={register} errors={errors} watch={watch} setValue={setValue} />
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
