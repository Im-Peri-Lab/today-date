import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { PlaceDetail } from '@/components/track/PlaceDetail'
import styles from '@/components/screens.module.css'

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { id } = await params

  return (
    <main className={styles.page}>
      <PlaceDetail id={id} />
    </main>
  )
}
