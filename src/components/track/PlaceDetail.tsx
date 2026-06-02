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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBadge } from './CategoryBadge'
import { RatingStars } from './RatingStars'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { VisitedDialog } from '@/components/VisitedDialog'
import { usePlace, useDeletePlace, useUpdatePlace } from '@/hooks/usePlaces'
import { MEAL_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

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
    <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
      <Link href="/list" className={styles.backLink}>
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {isLoading ? (
        <div className={cn(styles.card, 'mt-4 p-5')}>
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="mt-3 h-5 w-1/3" />
          <Skeleton className="mt-3 h-20 w-full" />
        </div>
      ) : isError || !place ? (
        <div className={cn(styles.empty, 'mt-4', styles.sub)}>장소를 찾을 수 없어요.</div>
      ) : (
        <>
          <div className={cn(styles.card, 'mt-4 p-5 lg:p-6')}>
            <div className="flex flex-wrap items-center gap-2">
              {place.category && <CategoryBadge category={place.category} />}
              {place.status === 'visited' && <span className={styles.visitedTag}>다녀온 곳</span>}
            </div>
            <h1 className={cn('mt-2 text-2xl font-bold lg:text-3xl', styles.ink)}>{place.title}</h1>

            <div
              className={cn(
                'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm',
                styles.sub
              )}
            >
              {place.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {place.location}
                </span>
              )}
              {place.meal_times?.map((m) => (
                <span key={m} className={styles.mealBadge}>
                  {MEAL_LABELS[m]}
                </span>
              ))}
            </div>

            {place.memo && (
              <p className={cn('mt-4 whitespace-pre-wrap text-sm leading-relaxed', styles.ink)}>
                {place.memo}
              </p>
            )}

            {place.reference_url && (
              <a
                href={place.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('mt-4 inline-flex items-center gap-1.5 text-sm hover:underline', styles.accent)}
              >
                <ExternalLink className="h-4 w-4" />
                참고 링크
              </a>
            )}

            {place.status === 'visited' && (
              <div className={cn(styles.visitBox, 'mt-4 p-4')}>
                <p className={cn('text-xs font-medium', styles.faint)}>방문 기록</p>
                {place.visited_at && (
                  <p className={cn('mt-1.5 text-sm', styles.ink)}>방문일 · {place.visited_at}</p>
                )}
                {place.rating ? (
                  <div className="mt-1.5">
                    <RatingStars value={place.rating} size="sm" />
                  </div>
                ) : null}
                {place.review_note && (
                  <p className={cn('mt-1.5 whitespace-pre-wrap text-sm leading-relaxed', styles.sub)}>
                    {place.review_note}
                  </p>
                )}
              </div>
            )}
          </div>

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
                className="gap-1.5 text-white hover:brightness-105"
                style={{ background: 'var(--s-active-fill, linear-gradient(135deg,#a855f7 0%,#ec4899 100%))' }}
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
