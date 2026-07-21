import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ActivityForm } from '@/components/track/ActivityForm'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')
  const { from } = await searchParams

  return (
    <main className={styles.page}>
      <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <h1 className={cn('mt-4', styles.pageTitle)}>활동 추가</h1>
        <p className={styles.pageSubtitle}>함께 하고 싶은 활동을 위시리스트에 추가해요</p>

        <div
          className={cn(
            styles.card,
            styles.detailCard,
            'mt-5 px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5',
          )}
        >
          <ActivityForm prefill={from === 'copy'} />
        </div>
      </div>
    </main>
  )
}
