import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/data/dashboard'
import { HomeDashboard } from '@/components/HomeDashboard'
import styles from '@/components/screens.module.css'

export default async function HomePage() {
  const session = await getSession()

  if (!session.authenticated) {
    redirect('/lock')
  }

  const initialStats = await getDashboardStats()

  return (
    <main className={styles.page}>
      <HomeDashboard initialStats={initialStats} />
    </main>
  )
}
