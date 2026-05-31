import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ActivityDetail } from '@/components/track/ActivityDetail'
import styles from '@/components/screens.module.css'

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { id } = await params

  return (
    <main className={styles.page}>
      <ActivityDetail id={id} />
    </main>
  )
}
