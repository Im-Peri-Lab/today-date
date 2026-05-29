import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ActivityDetail } from '@/components/track/ActivityDetail'

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { id } = await params

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <ActivityDetail id={id} />
    </main>
  )
}
