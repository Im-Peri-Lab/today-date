import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AccountInfoBlock } from '@/components/account/AccountInfoBlock'
import { getCoupleUsers } from '@/lib/auth/couple'
import { getSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 계정 화면 — SOLO/PAIRED 양쪽 모두 접근 가능하다(형제 화면 /partner/info 는 PAIRED
 * 전용, /account/delete 는 SOLO 전용이지만, 닉네임은 둘 다 설정할 수 있는 내 정보다).
 *
 * 세션 user_id 로 "나"를 직접 찾는다 — SOLO 의 users[0] 단정(§ /account/delete)이나
 * "나 아닌 한 명"(§ lib/auth/partner.ts)과 다르게, 이 화면은 PAIRED 에서도 둘 중
 * 정확히 나를 가리켜야 한다.
 */
export default async function AccountPage() {
  const session = await getSession()
  if (!session.authenticated || !session.couple_id || !session.user_id) redirect('/lock')

  const users = await getCoupleUsers(session.couple_id)
  const self = users.find((u) => u.id === session.user_id)

  // 세션은 유효하지만 가리키는 사용자 행이 없다 — 데이터 정합성이 깨진 상태라
  // 복구를 시도하지 않고 잠금 화면으로 보낸다(§ /account/delete 의 NONE 처리와 같은 판단).
  if (!self) redirect('/lock')

  return (
    <main className={styles.page}>
      <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <h1 className={cn('mt-4', styles.pageTitle)}>계정</h1>
        <p className={styles.pageSubtitle}>닉네임을 설정하면 파트너 화면에 표시돼요 💜</p>

        <div className="mt-5">
          <AccountInfoBlock email={self.email} initialNickname={self.nickname} />
        </div>
      </div>
    </main>
  )
}
