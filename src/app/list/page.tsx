import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ListView } from '@/components/track/ListView'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export default async function ListPage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className={cn(styles.page, styles.pageStatic)}>
      <ListView />
    </main>
  )
}
