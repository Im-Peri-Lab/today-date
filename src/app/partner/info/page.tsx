import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DetailRow } from '@/components/track/DetailRow'
import { getSessionPartner } from '@/lib/auth/partner'
import { formatKoreanTimestamp } from '@/lib/date'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 파트너 정보 화면 — PAIRED 상태의 사용자만 볼 수 있다.
 *
 * 보여주는 사람은 "세션 user_id 가 아닌 나머지 한 명"이다. 커플 밖의 사용자는 조회
 * 범위(couple_id)에 애초에 들어오지 않고, 나 자신도 제외된다(§ lib/auth/partner.ts).
 * 그래서 두 파트너가 같은 URL 을 열면 각자 상대의 정보를 본다.
 *
 * 상대가 없으면(SOLO) 홈으로 되돌린다 — 형제 화면인 /partner(초대)가 PAIRED 를
 * 되돌리는 것과 대칭이다. 메뉴는 PAIRED 에서만 이 진입점을 그리지만(§ HomeMenu),
 * URL 을 직접 열거나 파트너가 빠진 뒤 뒤로 가기로 돌아오는 경로가 있다.
 */
export default async function PartnerInfoPage() {
  const lookup = await getSessionPartner()

  if (!lookup.authenticated) redirect('/lock')
  if (!lookup.partner) redirect('/')

  const { partner } = lookup

  return (
    <main className={styles.page}>
      <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-6 lg:pt-10">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <h1 className={cn('mt-4', styles.pageTitle)}>파트너</h1>
        <p className={styles.pageSubtitle}>함께 위시리스트를 쌓고 있는 한 사람 💜</p>

        <section
          className={cn(
            styles.card,
            styles.detailCard,
            'mt-5 px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5',
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* 이메일은 길어서 줄바꿈이 필요하므로 wide(2열 점유) — § 디자인 10-C */}
            <DetailRow label="이메일" wide>
              <span className="break-all">{partner.email}</span>
            </DetailRow>
            {/*
              닉네임은 미설정이 정상 상태다(§ 016) — 설정했을 때만 행을 추가한다.
              이메일(인증 식별자)은 이 화면에서 항상 함께 보여준다 — 닉네임 하나로만
              가리키면 상대를 바꿔 쓸 수 있는 자리라 식별자가 필요하다(§ displayName
              과 다르게 이 화면은 "둘 다 보여줄 여유가 있는" 쪽이다).
            */}
            {partner.nickname && <DetailRow label="닉네임">{partner.nickname}</DetailRow>}
            <DetailRow label="가입일">{formatKoreanTimestamp(partner.joinedAt)}</DetailRow>
          </div>
        </section>
      </div>
    </main>
  )
}
