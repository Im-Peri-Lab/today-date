import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getPlaceById } from '@/lib/data/places'
import { PlaceDetail } from '@/components/track/PlaceDetail'
import { getSafeListReturnTo } from '@/lib/listReturn'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export default async function PlaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string; returnTo?: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { id } = await params
  const { edit, returnTo } = await searchParams

  const place = await getPlaceById(id)
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
