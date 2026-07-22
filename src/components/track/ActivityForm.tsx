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
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      location: values.location || null,
      memo: values.memo || null,
    }

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

    if (continueAdding) {
      reset()
      setHasContinuedRegistration(true)
      toast.success('활동이 등록됐어요! 계속 등록해보세요 🎉')
      return
    }

    setNavigating(true)
    topLoader.start()
    router.push(
      hasContinuedRegistration
        ? returnTo ?? '/list?tab=activity'
        : buildDetailHref(`/activities/${json.data.id}`, { returnTo })
    )
  }

  return (
    <FormLayout
      onSubmit={handleSubmit((values) => onSubmit(values, false))}
      onSubmitAndContinue={handleSubmit((values) => onSubmit(values, true))}
      isSubmitting={isSubmitting || navigating}
      submitLabel="활동 등록하기"
    >
      <ActivityFields register={register} errors={errors} watch={watch} setValue={setValue} />
    </FormLayout>
  )
}
