import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { PlaceRecommendWizard } from '@/components/recommend/PlaceRecommendWizard'
import styles from '@/components/screens.module.css'

export default async function RecommendPlacePage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className={styles.page}>
      <PlaceRecommendWizard />
    </main>
  )
}
