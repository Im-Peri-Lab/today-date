import { redirect } from 'next/navigation'
import { deriveWorkspaceState, getCoupleById, getCoupleUsers } from '@/lib/auth/couple'
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

  /**
   * 워크스페이스 상태는 세션의 커플로 판별한다(getWorkspaceStatus 의 "커플이 1개일 때만"
   * 경로를 쓰지 않는다) — 커플이 여러 개가 되어도 홈은 항상 자기 커플의 상태를 본다.
   * SOLO 일 때만 파트너 초대 진입점을 그린다(§ HomeDashboard).
   */
  const [initialStats, couple, users] = await Promise.all([
    getDashboardStats(session.couple_id),
    getCoupleById(session.couple_id),
    getCoupleUsers(session.couple_id),
  ])

  return (
    <main className={cn(styles.page, styles.pageHome)}>
      {/* 추천 배너는 CSS background-image 라 CSS 적용 후에야 받기 시작한다 — 단색 → 이미지 깜빡임을 줄이려
          홈에서만 미리 받는다. href·type 은 screens.module.css 의 image-set(WebP)과 정확히 같아야 한다(다르면 이중 다운로드). */}
      <link rel="preload" as="image" href="/images/cta-banner-activity.webp" type="image/webp" />
      <link rel="preload" as="image" href="/images/cta-banner-dining.webp" type="image/webp" />
      <HomeDashboard
        initialStats={initialStats}
        workspaceState={deriveWorkspaceState(couple, users)}
      />
    </main>
  )
}
