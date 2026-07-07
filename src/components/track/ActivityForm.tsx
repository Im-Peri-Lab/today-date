'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { FormLayout } from '@/components/forms/FormLayout'
import { ActivityFields } from './ActivityFields'
import { useUpdateActivity } from '@/hooks/useActivities'
import { takeActivityPrefill } from '@/lib/duplicatePrefill'
import { activityFormSchema, type ActivityFormValues } from '@/lib/schemas/activitySchema'
import type { Activity } from '@/types'

export function ActivityForm({ activity, prefill }: { activity?: Activity; prefill?: boolean }) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const queryClient = useQueryClient()
  const update = useUpdateActivity()
  const isEdit = !!activity
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: activity
      ? {
          title: activity.title,
          category_id: activity.category_id ?? '',
          duration_bucket: activity.duration_bucket ?? undefined,
          time_of_day: activity.time_of_day,
          location: activity.location ?? '',
          memo: activity.memo ?? '',
          reference_url: activity.reference_url ?? '',
        }
      : {},
  })

  // 복사하기 진입(?from=copy): 마운트 후 sessionStorage 의 prefill 값을 읽어(one-shot) 폼에 채운다.
  // 초기 렌더는 서버와 동일한 빈 폼이라 hydration 불일치가 없다. 저장 전까지 DB 생성 없음.
  useEffect(() => {
    if (isEdit || !prefill) return
    const values = takeActivityPrefill()
    if (values) reset(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: ActivityFormValues) {
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      location: values.location || null,
      memo: values.memo || null,
    }

    if (isEdit) {
      try {
        await update.mutateAsync({ id: activity!.id, patch: payload })
        toast.success('수정되었습니다! ✏️')
        router.push(`/activities/${activity!.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
      }
    } else {
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
      // 리스트는 미마운트 상태(사용자가 상세로 이동)라도 즉시 백그라운드 재조회되도록
      // refetchType: 'all'. 복귀 시 새 항목이 누락되지 않고 바로 보인다.
      queryClient.invalidateQueries({ queryKey: ['activities'], refetchType: 'all' })
      toast.success('활동이 등록되었습니다! 🎉')
      topLoader.start()
      router.push(`/activities/${json.data.id}`)
    }
  }

  return (
    <FormLayout
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? '수정 저장하기' : '활동 등록하기'}
    >
      <ActivityFields register={register} errors={errors} watch={watch} setValue={setValue} />
    </FormLayout>
  )
}
