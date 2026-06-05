import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { PlaceDetail } from '@/components/track/PlaceDetail'
import styles from '@/components/screens.module.css'

export default async function PlaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { id } = await params
  const { edit } = await searchParams

  return (
    <main className={styles.page}>
      <PlaceDetail id={id} initialEdit={edit === 'info' || edit === 'visit' ? edit : undefined} />
    </main>
  )
}
