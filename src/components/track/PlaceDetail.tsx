'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Undo2,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBadge } from './CategoryBadge'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { usePlace, useDeletePlace, useUpdatePlace } from '@/hooks/usePlaces'
import { MEAL_LABELS } from '@/lib/labels'

export function PlaceDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: place, isLoading, isError } = usePlace(id)
  const del = useDeletePlace()
  const update = useUpdatePlace()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [visitedOpen, setVisitedOpen] = useState(false)

  function handleDelete() {
    del.mutate(id, {
      onSuccess: () => {
        toast.success('삭제했어요')
        router.push('/list')
      },
      onError: () => toast.error('삭제 중 오류가 발생했습니다.'),
    })
  }

  function handleRevert() {
    update.mutate(
      { id, patch: { status: 'wishlist' } },
      {
        onSuccess: () => toast.success('위시리스트로 옮겼어요'),
        onError: () => toast.error('변경 중 오류가 발생했습니다.'),
      }
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link
        href="/list"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {isLoading ? (
        <Card className="shadow-xl border-violet-100">
          <CardHeader>
            <Skeleton className="h-7 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : isError || !place ? (
        <div className="rounded-xl border border-dashed border-violet-200 bg-white/50 p-10 text-center text-gray-500">
          장소를 찾을 수 없어요.
        </div>
      ) : (
        <>
          <Card className="shadow-xl border-violet-100">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                {place.category && <CategoryBadge category={place.category} />}
                {place.status === 'visited' && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    다녀온 곳
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-bold text-violet-900">{place.title}</h1>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {place.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {place.location}
                  </span>
                )}
                {place.meal_times?.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {MEAL_LABELS[m]}
                  </span>
                ))}
              </div>

              {place.memo && (
                <p className="whitespace-pre-wrap text-sm text-foreground">{place.memo}</p>
              )}

              {place.reference_url && (
                <a
                  href={place.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  참고 링크
                </a>
              )}

              {place.status === 'visited' && (
                <div className="space-y-2 rounded-lg bg-violet-50/60 p-3">
                  {place.visited_at && (
                    <p className="text-sm text-violet-800">방문일: {place.visited_at}</p>
                  )}
                  {place.rating ? <RatingStars value={place.rating} size="sm" /> : null}
                  {place.review_note && (
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {place.review_note}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/places/${id}/edit`}>
              <Button variant="outline" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                수정
              </Button>
            </Link>
            {place.status === 'visited' ? (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setVisitedOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  방문 정보 수정
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={handleRevert}>
                  <Undo2 className="h-4 w-4" />
                  위시리스트로
                </Button>
              </>
            ) : (
              <Button
                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => setVisitedOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                다녀왔어요
              </Button>
            )}
            <Button variant="destructive" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          </div>

          <DeleteConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={place.title}
            loading={del.isPending}
            onConfirm={handleDelete}
          />
          <VisitedDialog
            open={visitedOpen}
            onOpenChange={setVisitedOpen}
            track="place"
            id={id}
            title={place.title}
            initial={{
              visited_at: place.visited_at,
              rating: place.rating,
              review_note: place.review_note,
            }}
          />
        </>
      )}
    </div>
  )
}
