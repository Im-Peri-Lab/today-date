import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ActivityRecommendWizard } from '@/components/recommend/ActivityRecommendWizard'

export default async function RecommendActivityPage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <ActivityRecommendWizard />
    </main>
  )
}
