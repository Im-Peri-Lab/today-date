'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { FormLayout } from '@/components/forms/FormLayout'
import { ActivityFields } from './ActivityFields'
import { takeActivityPrefill } from '@/lib/duplicatePrefill'
import { buildDetailHref } from '@/lib/listReturn'
import { activityFormSchema, type ActivityFormValues } from '@/lib/schemas/activitySchema'
import { plannedTimePayload } from '@/lib/plannedTime'
import { emptyToNull } from '@/lib/schemas/apiFields'
import { fetchJson } from '@/hooks/fetcher'
import { invalidateDashboardStats } from '@/hooks/useDashboardStats'
import { stashCalendarOffer } from '@/lib/calendar/createOffer'
import type { Activity } from '@/types'

export function ActivityForm({ prefill, returnTo }: { prefill?: boolean; returnTo?: string }) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const queryClient = useQueryClient()
  // router.push(App Router)는 비동기 전환이라 즉시 반환된다. 성공 직후 isSubmitting이
  // false로 풀리면 실제 화면 전환 전까지 버튼이 재활성화되어 잠깐 깜빡인다.
  // push 직전에 navigating=true로 잠가 전환 완료(=언마운트)까지 비활성을 유지한다.
  // 페이지가 언마운트되며 자연히 정리되므로 별도 해제 로직은 불필요.
  const [navigating, setNavigating] = useState(false)
  const [hasContinuedRegistration, setHasContinuedRegistration] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {},
  })

  // 복사하기 진입(?from=copy): 마운트 후 sessionStorage 의 prefill 값을 읽어(one-shot) 폼에 채운다.
  // 초기 렌더는 서버와 동일한 빈 폼이라 hydration 불일치가 없다. 저장 전까지 DB 생성 없음.
  useEffect(() => {
    if (!prefill) return
    const values = takeActivityPrefill()
    if (values) reset(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: ActivityFormValues, continueAdding: boolean) {
    const payload = {
      ...values,
      category_id: emptyToNull(values.category_id),
      reference_url: emptyToNull(values.reference_url),
      location: emptyToNull(values.location),
      memo: emptyToNull(values.memo),
      planned_at: emptyToNull(values.planned_at),
      // 날짜 없이 시간만 보내지 않는다(API 짝 규칙, 021)
      planned_time: plannedTimePayload(values.planned_at, values.planned_time),
    }

    let created: Activity
    try {
      const json = await fetchJson<{ data: Activity }>('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      created = json.data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
      return
    }

    // 리스트는 미마운트 상태(사용자가 상세로 이동)라도 즉시 백그라운드 재조회되도록
    // refetchType: 'all'. 복귀 시 새 항목이 누락되지 않고 바로 보인다.
    queryClient.invalidateQueries({ queryKey: ['activities'], refetchType: 'all' })
    invalidateDashboardStats(queryClient)

    if (continueAdding) {
      reset()
      setHasContinuedRegistration(true)
      toast.success('액티비티가 등록됐어요! 계속 등록해보세요 🎉')
      return
    }

    // 예정일과 함께 등록해 상세로 가는 경우에만 캘린더 제안을 예약한다(상세 도착 시 1회 표시).
    // 연속 등록 뒤 목록으로 가는 경우는 상세에 도착하지 않으므로 예약하지 않는다.
    if (!hasContinuedRegistration && created.planned_at) stashCalendarOffer('activity', created.id)
    setNavigating(true)
    topLoader.start()
    router.push(
      hasContinuedRegistration
        ? returnTo ?? '/list?tab=activity'
        : buildDetailHref(`/activities/${created.id}`, { returnTo })
    )
  }

  return (
    <FormLayout
      onSubmit={handleSubmit((values) => onSubmit(values, false))}
      onSubmitAndContinue={handleSubmit((values) => onSubmit(values, true))}
      isSubmitting={isSubmitting || navigating}
      submitLabel="액티비티 등록하기"
    >
      <ActivityFields register={register} errors={errors} watch={watch} setValue={setValue} showPlannedAt />
    </FormLayout>
  )
}
