import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { PlaceRecommendWizard } from '@/components/recommend/PlaceRecommendWizard'

export default async function RecommendPlacePage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className="min-h-svh bg-gradient-to-br from-violet-50 to-purple-100">
      <PlaceRecommendWizard />
    </main>
  )
}
