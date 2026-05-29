import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ActivityEdit } from '@/components/track/ActivityEdit'

export default async function ActivityEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { id } = await params

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <ActivityEdit id={id} />
    </main>
  )
}
