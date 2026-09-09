import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AccountDeleteForm } from '@/components/account/AccountDeleteForm'
import { DetailRow } from '@/components/track/DetailRow'
import { deriveWorkspaceState, getCoupleById, getCoupleUsers } from '@/lib/auth/couple'
import { getSession } from '@/lib/auth/session'
import { formatKoreanTimestamp } from '@/lib/date'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 계정 삭제 화면 — SOLO 상태의 사용자만 볼 수 있다.
 *
 * PAIRED 면 홈으로 되돌린다. 삭제가 상대의 데이터까지 지우는 일이 되기 때문이고
 * (§ lib/auth/accountDeletion.ts), 그 판정은 API 도 독립적으로 다시 한다 — 이
 * 리다이렉트는 화면 정합성용이고 보안 경계는 서버다(§ app/partner/page.tsx 와 같은 구조).
 * 메뉴는 SOLO 에서만 이 진입점을 그리지만(§ HomeMenu), URL 을 직접 열거나 파트너가
 * 합류한 뒤 뒤로 가기로 돌아오는 경로가 있다.
 *
 * 형제 화면들과의 계위: /partner(초대 — SOLO 전용) · /partner/info(상대 정보 — PAIRED
 * 전용) · /account/delete(탈퇴 — SOLO 전용). 셋 다 서버에서 상태를 판정해 맞지 않는
 * 상태면 되돌린다.
 */
export default async function AccountDeletePage() {
  const session = await getSession()
  if (!session.authenticated || !session.couple_id) redirect('/lock')

  const [couple, users] = await Promise.all([
    getCoupleById(session.couple_id),
    getCoupleUsers(session.couple_id),
  ])

  const state = deriveWorkspaceState(couple, users)
  if (state === 'PAIRED') redirect('/')
  /*
   * NONE(커플 행이나 사용자 행이 없다)은 세션이 유효할 수 없는 상태다 — 보여줄 계정
   * 정보가 없으므로 잠금 화면으로 보낸다.
   *
   * API 는 사용자 0명인 커플도 지운다(§ lib/auth/accountDeletion.ts 부분 삭제 복구).
   * 화면이 더 좁은 것은 어긋남이 아니다: 그 상태의 복구 경로는 "다시 삭제"가 아니라
   * 같은 이메일로 재가입해 그 커플을 물려받는 것이고, 그건 /setup 이 담당한다.
   */
  if (state !== 'SOLO') redirect('/lock')

  // SOLO 는 사용자가 정확히 1명이므로 모호함이 없다(§ deriveWorkspaceState).
  const self = users[0]

  return (
    <main className={styles.page}>
      <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <h1 className={cn('mt-4', styles.pageTitle)}>계정 삭제</h1>
        <p className={styles.pageSubtitle}>
          계정을 지우면 같은 이메일로 다시 시작할 수 있어요.
        </p>

        <section
          className={cn(
            styles.card,
            styles.detailCard,
            'mt-5 px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5',
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* 이메일은 길어서 줄바꿈이 필요하므로 wide(2열 점유) — § 디자인 10-C */}
            <DetailRow label="삭제할 계정" wide>
              <span className="break-all">{self.email}</span>
            </DetailRow>
            <DetailRow label="가입일">{formatKoreanTimestamp(self.created_at)}</DetailRow>
          </div>

          <div className={styles.sheetRow}>
            <p className={cn('mb-1.5 uppercase tracking-wide', styles.sectionLabel)}>
              함께 삭제되는 것
            </p>
            <ul className={cn('list-disc space-y-1 pl-4', styles.bodyText)}>
              <li>가보고 싶은 · 다녀온 액티비티 기록 전체</li>
              <li>가보고 싶은 · 다녀온 다이닝 기록 전체</li>
              <li>추천 기록과 이메일 인증·초대 정보</li>
            </ul>
            {/*
              destructive 는 전경색으로만 쓴다 — 빨간 배너 면을 새로 만들지 않는다
              (§ 디자인 5-B: 삭제 글자·아이콘 색은 솔리드 단일 출처).
            */}
            <p className="mt-3 text-sm font-medium text-destructive">
              삭제하면 되돌릴 수 없어요.
            </p>
          </div>

          <div className="mt-5">
            <AccountDeleteForm />
          </div>
        </section>
      </div>
    </main>
  )
}
