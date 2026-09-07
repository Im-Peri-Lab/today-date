import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/data/dashboard'
import { HomeDashboard } from '@/components/HomeDashboard'
import styles from '@/components/screens.module.css'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const session = await getSession()

  // couple_id 없는 세션은 전환 이전 쿠키다 — 미들웨어가 만료 처리하지만,
  // 서버 컴포넌트가 커플 없이 데이터를 읽는 경로를 남기지 않도록 여기서도 닫는다.
  if (!session.authenticated || !session.couple_id) {
    redirect('/lock')
  }

  const initialStats = await getDashboardStats(session.couple_id)

  return (
    <main className={cn(styles.page, styles.pageHome)}>
      <HomeDashboard initialStats={initialStats} />
    </main>
  )
}
