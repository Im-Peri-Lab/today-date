import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TopBar } from '@/components/TopBar'
import { CalendarTitlePrefixBlock } from '@/components/settings/CalendarTitlePrefixBlock'
import { getSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 설정 화면 — 앱 설정이 한 곳에 쌓이는 자리. 항목은 카드 하나씩 위에서 아래로 추가한다.
 * 지금 설정은 이 기기(브라우저)에 저장되는 값뿐이라 서버 조회가 없고, 세션 확인만 한다.
 */
export default async function SettingsPage() {
  const session = await getSession()
  if (!session.authenticated || !session.couple_id) redirect('/lock')

  return (
    <main className={styles.page}>
      <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
        <TopBar>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>
        </TopBar>

        <h1 className={cn('mt-4', styles.pageTitle)}>설정</h1>
        <p className={styles.pageSubtitle}>이 기기에서 쓰는 설정이에요</p>

        <div className="mt-5 space-y-4">
          <CalendarTitlePrefixBlock />
        </div>
      </div>
    </main>
  )
}
