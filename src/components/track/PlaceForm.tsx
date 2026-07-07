'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { FormLayout } from '@/components/forms/FormLayout'
import { PlaceFields } from './PlaceFields'
import { takePlacePrefill } from '@/lib/duplicatePrefill'
import { placeFormSchema, type PlaceFormValues } from '@/lib/schemas/placeSchema'
import type { Place } from '@/types'

export function PlaceForm({ place, prefill }: { place?: Place; prefill?: boolean }) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const queryClient = useQueryClient()
  const isEdit = !!place
  // router.push(App Router)는 비동기 전환이라 즉시 반환된다. 성공 직후 isSubmitting이
  // false로 풀리면 실제 화면 전환 전까지 버튼이 재활성화되어 잠깐 깜빡인다.
  // push 직전에 navigating=true로 잠가 전환 완료(=언마운트)까지 비활성을 유지한다.
  // 페이지가 언마운트되며 자연히 정리되므로 별도 해제 로직은 불필요.
  const [navigating, setNavigating] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: place
      ? {
          title: place.title,
          category_id: place.category_id ?? '',
          area: place.area,
          location: place.location ?? '',
          meal_times: place.meal_times,
          memo: place.memo ?? '',
          reference_url: place.reference_url ?? '',
        }
      : { meal_times: [] },
  })

  // 복사하기 진입(?from=copy): 마운트 후 sessionStorage 의 prefill 값을 읽어(one-shot) 폼에 채운다.
  // 초기 렌더는 서버와 동일한 빈 폼이라 hydration 불일치가 없다. 저장 전까지 DB 생성 없음.
  useEffect(() => {
    if (isEdit || !prefill) return
    const values = takePlacePrefill()
    if (values) reset(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: PlaceFormValues) {
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
      location: values.location || null,
      memo: values.memo || null,
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
      // 리스트는 미마운트 상태에서도 즉시 백그라운드 재조회되도록 refetchType: 'all'.
      // /list 복귀 시 이전 값 프레임 없이 바로 최신 목록이 보인다.
      queryClient.invalidateQueries({ queryKey: ['places'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['place', place!.id] })
      toast.success('수정되었습니다! ✏️')
      router.push(`/places/${place!.id}`)
    } else {
      // 신규 등록도 동일: 리스트를 즉시 재조회해 복귀 시 새 항목이 바로 보이도록 한다.
      queryClient.invalidateQueries({ queryKey: ['places'], refetchType: 'all' })
      setNavigating(true)
      topLoader.start()
      router.push(`/places/${json.data.id}`)
    }
  }

  return (
    <FormLayout
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting || navigating}
      submitLabel={isEdit ? '수정 저장하기' : '장소 등록하기'}
    >
      <PlaceFields register={register} errors={errors} watch={watch} setValue={setValue} />
    </FormLayout>
  )
}
