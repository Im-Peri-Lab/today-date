import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ActivityRecommendWizard } from '@/components/recommend/ActivityRecommendWizard'
import styles from '@/components/screens.module.css'

export default async function RecommendActivityPage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className={styles.page}>
      <ActivityRecommendWizard />
    </main>
  )
}
