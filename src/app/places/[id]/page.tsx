import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getPlaceById } from '@/lib/data/places'
import { PlaceDetail } from '@/components/track/PlaceDetail'
import { getSafeListReturnTo } from '@/lib/listReturn'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'
import { ServerTiming } from '@/lib/diag/serverTiming'

export default async function PlaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string; returnTo?: string }>
}) {
  // [진단 전용] 서버 로그만(헤더 불가). Server-Timing 은 /api/diag/render-timing?page=place&id=…
  const st = new ServerTiming('place')
  const session = await st.time('session', () => getSession())
  if (!session.authenticated || !session.couple_id) redirect('/lock')
  const { id } = await params
  const { edit, returnTo } = await searchParams

  const coupleId = session.couple_id
  const place = await st.time('query', () => getPlaceById(id, coupleId))
  st.total()
  st.log('place-render')
  if (!place) notFound()

  return (
    <main className={cn(styles.page, styles.pageStatic)}>
      <PlaceDetail
        id={id}
        initialData={place}
        initialEdit={edit === 'info' || edit === 'visit' ? edit : undefined}
        returnTo={getSafeListReturnTo(returnTo)}
      />
    </main>
  )
}
