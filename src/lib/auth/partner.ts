import { getCoupleUsers, pickPartnerUser } from '@/lib/auth/couple'
import { getSession } from '@/lib/auth/session'

/**
 * "나 아닌 한 명"을 세션에서 찾아내는 단일 경로 — 화면(/partner/info)과
 * API(/api/partner)가 같은 판정을 공유한다.
 *
 * 커플을 특정하는 방법은 세션의 couple_id 뿐이고(§ lib/auth/couple.ts),
 * 그 커플 안에서 내가 누구인지는 세션의 user_id 가 가리킨다. 두 값을 모두 갖춘
 * 세션만 파트너를 물어볼 수 있다 — 커플만 알고 나를 모르면 두 사람 중 누구를
 * 지워야 할지 알 수 없으므로 조회 자체가 성립하지 않는다.
 */

/** 파트너 노출 형태 — users 행에서 화면이 쓰는 두 필드만 꺼낸다. */
export interface PartnerInfo {
  email: string
  /** users.created_at (ISO timestamptz). 화면에서 "가입일"로 표시한다. */
  joinedAt: string
}

export type PartnerLookup =
  /** 세션이 없거나 커플/사용자를 특정할 수 없다 — 화면은 /lock, API 는 401. */
  | { authenticated: false }
  /** 조회는 성립했다. partner=null 은 SOLO(상대가 없음)라는 뜻이다. */
  | { authenticated: true; partner: PartnerInfo | null }

export async function getSessionPartner(): Promise<PartnerLookup> {
  const session = await getSession()

  if (!session.authenticated || !session.couple_id || !session.user_id) {
    return { authenticated: false }
  }

  const users = await getCoupleUsers(session.couple_id)
  const partner = pickPartnerUser(users, session.user_id)

  return {
    authenticated: true,
    partner: partner ? { email: partner.email, joinedAt: partner.created_at } : null,
  }
}
