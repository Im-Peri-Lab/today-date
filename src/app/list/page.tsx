import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ListView } from '@/components/track/ListView'
import styles from '@/components/screens.module.css'

export default async function ListPage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className={styles.page}>
      <ListView />
    </main>
  )
}
