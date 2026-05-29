import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ListView } from '@/components/track/ListView'

export default async function ListPage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <ListView />
    </main>
  )
}
