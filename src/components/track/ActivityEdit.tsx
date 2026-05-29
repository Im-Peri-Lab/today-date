'use client'

import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityForm } from './ActivityForm'
import { useActivity } from '@/hooks/useActivities'

export function ActivityEdit({ id }: { id: string }) {
  const { data: activity, isLoading, isError } = useActivity(id)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link
        href={`/activities/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로
      </Link>

      <Card className="shadow-xl border-violet-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-violet-500" />
            <CardTitle className="text-xl text-violet-800">활동 수정</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError || !activity ? (
            <p className="py-8 text-center text-sm text-gray-500">활동을 찾을 수 없어요.</p>
          ) : (
            <ActivityForm activity={activity} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
