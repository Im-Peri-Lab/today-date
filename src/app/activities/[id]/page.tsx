import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ActivityDetail } from '@/components/track/ActivityDetail'
import styles from '@/components/screens.module.css'

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { id } = await params
  const { mode } = await searchParams

  return (
    <main className={styles.page}>
      <ActivityDetail id={id} initialMode={mode === 'edit' ? 'edit' : 'view'} />
    </main>
  )
}
