import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { deriveWorkspaceState, getCoupleById, getCoupleUsers } from '@/lib/auth/couple'
import { getSession } from '@/lib/auth/session'
import { PartnerInviteForm } from '@/components/PartnerInviteForm'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 파트너 초대 화면 — SOLO 상태의 사용자만 볼 수 있다.
 *
 * PAIRED 면 초대할 자리가 없으므로 홈으로 되돌린다. 홈은 PAIRED 에서 진입점을 감추지만
 * (§ HomeDashboard), URL 을 직접 열거나 초대 성립 후 뒤로 가기로 돌아오는 경로가 있다.
 * 발송 API 도 같은 판정을 독립적으로 하므로(§ api/auth/invite) 이 리다이렉트는 화면
 * 정합성용이고 보안 경계는 서버 쪽이다.
 */
export default async function PartnerInvitePage() {
  const session = await getSession()
  if (!session.authenticated || !session.couple_id) redirect('/lock')

  const [couple, users] = await Promise.all([
    getCoupleById(session.couple_id),
    getCoupleUsers(session.couple_id),
  ])

  if (deriveWorkspaceState(couple, users) === 'PAIRED') redirect('/')

  return (
    <main className={styles.page}>
      <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <h1 className={cn('mt-4', styles.pageTitle)}>파트너 초대</h1>
        <p className={styles.pageSubtitle}>둘이 함께 위시리스트를 쌓아보세요 💜</p>

        <div
          className={cn(
            styles.card,
            styles.detailCard,
            'mt-5 px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5',
          )}
        >
          <PartnerInviteForm />
        </div>
      </div>
    </main>
  )
}
