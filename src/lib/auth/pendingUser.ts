import { sealData, unsealData } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'

/**
 * 초대를 수락한 직후 "다음 잠금해제는 이 사용자다"를 서버가 스스로에게 남기는 쪽지.
 *
 * 왜 필요한가: 패스코드는 커플 단위로 하나뿐이라, /api/auth/unlock 이 받는 정보만으로는
 * 두 파트너 중 누가 들어왔는지 알 수 없다(pickSessionUser 는 먼저 만들어진 사용자로
 * 수렴한다). 초대 수락 직후에는 "방금 합류한 그 사람"이 세션 주체여야 하므로,
 * /invite 가 새 user_id 와 couple_id 를 이 쿠키에 담아 두고 unlock 이 그것을 읽는다.
 *
 * 세션 쿠키와 같은 시크릿으로 sealData 한다 — 값을 위조해 남의 커플의 user_id 로
 * 세션을 받아내는 경로를 만들지 않기 위함이다. 쿠키가 위조·변조되면 unseal 이 실패하고
 * unlock 은 쿠키가 없는 것과 동일하게(커플 1개일 때만 통과) 동작한다.
 *
 * 이 쿠키만으로는 아무것도 열리지 않는다. 세션 발급은 여전히 패스코드 검증을 통과해야
 * 하며, 이 쿠키는 "통과했을 때 누구로 발급할지"만 정한다.
 */

export const PENDING_USER_COOKIE = 'today-date-pending-user'

/** 초대 수락 → 패스코드 입력까지 사람이 걸리는 시간. 짧게 두어 방치된 쪽지를 남기지 않는다. */
export const PENDING_USER_MAX_AGE = 30 * 60 // 30분

export interface PendingUser {
  user_id: string
  couple_id: string
}

export async function sealPendingUser(pending: PendingUser): Promise<string> {
  return sealData(pending, {
    password: sessionOptions.password as string,
    ttl: PENDING_USER_MAX_AGE,
  })
}

/** 복호화 실패·형태 불일치는 모두 null — 호출부는 "쪽지 없음"과 같게 취급한다. */
export async function readPendingUser(raw: string | undefined): Promise<PendingUser | null> {
  if (!raw) return null

  try {
    const data = await unsealData<Partial<PendingUser>>(raw, {
      password: sessionOptions.password as string,
    })
    if (!data?.user_id || !data?.couple_id) return null
    return { user_id: data.user_id, couple_id: data.couple_id }
  } catch {
    return null
  }
}
