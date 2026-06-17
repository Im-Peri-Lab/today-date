import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getActivityById } from '@/lib/data/activities'
import { ActivityDetail } from '@/components/track/ActivityDetail'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export default async function ActivityDetailPage({
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

  const activity = await getActivityById(id)
  if (!activity) notFound()

  return (
    <main className={cn(styles.page, styles.pageStatic)}>
      <ActivityDetail
        id={id}
        initialData={activity}
        initialEdit={edit === 'info' || edit === 'visit' ? edit : undefined}
      />
    </main>
  )
}
