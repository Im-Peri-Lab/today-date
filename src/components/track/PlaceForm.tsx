'use client'

import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { FormLayout } from '@/components/forms/FormLayout'
import { PlaceFields } from './PlaceFields'
import { placeFormSchema, type PlaceFormValues } from '@/lib/schemas/placeSchema'
import type { Place } from '@/types'

export function PlaceForm({ place }: { place?: Place }) {
  const router = useRouter()
  const topLoader = useTopLoader()
  const queryClient = useQueryClient()
  const isEdit = !!place
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: place
      ? {
          title: place.title,
          category_id: place.category_id ?? '',
          area: place.area,
          meal_times: place.meal_times,
          memo: place.memo ?? '',
          reference_url: place.reference_url ?? '',
        }
      : { meal_times: [] },
  })

  async function onSubmit(values: PlaceFormValues) {
    const payload = {
      ...values,
      category_id: values.category_id || null,
      reference_url: values.reference_url || null,
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
      queryClient.invalidateQueries({ queryKey: ['places'] })
      queryClient.invalidateQueries({ queryKey: ['place', place!.id] })
      toast.success('수정되었습니다! ✏️')
      router.push(`/places/${place!.id}`)
    } else {
      toast.success('장소가 등록되었습니다! 📍')
      topLoader.start()
      router.push(`/places/${json.data.id}`)
    }
  }

  return (
    <FormLayout
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? '수정 저장하기' : '장소 등록하기'}
    >
      <PlaceFields register={register} errors={errors} watch={watch} setValue={setValue} />
    </FormLayout>
  )
}
