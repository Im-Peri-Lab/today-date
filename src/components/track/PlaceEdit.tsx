'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PlaceForm } from './PlaceForm'
import { usePlace } from '@/hooks/usePlaces'

export function PlaceEdit({ id }: { id: string }) {
  const { data: place, isLoading, isError } = usePlace(id)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link
        href={`/places/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로
      </Link>

      <Card className="shadow-xl border-violet-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-violet-500" />
            <CardTitle className="text-xl text-violet-800">장소 수정</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError || !place ? (
            <p className="py-8 text-center text-sm text-gray-500">장소를 찾을 수 없어요.</p>
          ) : (
            <PlaceForm place={place} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
