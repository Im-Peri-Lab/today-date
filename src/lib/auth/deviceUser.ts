import { sealData, unsealData } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'

/**
 * "이 기기는 두 파트너 중 이 사람이다"를 기억하는 장기 쿠키.
 *
 * 왜 필요한가: 패스코드는 커플 단위로 하나뿐이라, /api/auth/unlock 이 받는 정보만으로는
 * 두 파트너 중 누가 들어왔는지 알 수 없다. 단서가 없으면 세션은 먼저 만들어진 사용자로
 * 수렴하고(§ couple.ts pickSessionUser 가 하던 일), 그러면 초대받은 사람이 재로그인할
 * 때마다 파트너 화면에서 자기 이메일을 "파트너"로 보게 된다.
 *
 * pending-user 쪽지(§ pendingUser.ts)와의 차이는 수명과 의미다:
 *   - 쪽지  — 1회용·30분. "방금 초대를 수락한 사람"이라는 일회성 사실.
 *   - 기기 기억 — 1년·재사용. "이 브라우저의 주인"이라는 지속적 사실.
 * 쪽지를 쓴 잠금해제가 이 쿠키를 심어, 그 뒤의 재로그인이 같은 사람으로 이어진다.
 *
 * 세션 쿠키와 같은 시크릿으로 sealData 한다 — 값을 위조해 남의 user_id 로 세션을
 * 받아내는 경로를 만들지 않기 위함이다. 위조·변조되면 unseal 이 실패해 쿠키가 없는
 * 것과 동일하게 동작한다(= 누구인지 다시 확인).
 *
 * 이 쿠키만으로는 아무것도 열리지 않는다. 세션 발급은 여전히 패스코드 검증을 통과해야
 * 하고, 이 쿠키는 "통과했을 때 누구로 발급할지"만 정한다. 또한 두 파트너는 데이터
 * 권한이 완전히 동등하므로(커플 단위 공유) 이 값이 틀려도 볼 수 있는 데이터는 같다 —
 * 틀리면 "내가 누구인지"를 묻는 화면(파트너 정보)만 어긋난다.
 *
 * 명시적 로그아웃과 계정 삭제는 이 쿠키를 지운다 — § app/api/auth/logout/route.ts.
 */

export const DEVICE_USER_COOKIE = 'today-date-device-user'

/**
 * 1년. 세션(30일)보다 길게 두는 것이 이 쿠키의 목적이다 — 세션이 만료돼 다시
 * 패스코드를 넣는 평소 재로그인에서 "누구인지"를 다시 묻지 않기 위한 기억이다.
 */
export const DEVICE_USER_MAX_AGE = 365 * 24 * 60 * 60

export interface DeviceUser {
  user_id: string
  couple_id: string
}

export async function sealDeviceUser(device: DeviceUser): Promise<string> {
  return sealData(device, {
    password: sessionOptions.password as string,
    ttl: DEVICE_USER_MAX_AGE,
  })
}

/** 복호화 실패·형태 불일치는 모두 null — 호출부는 "기억 없음"과 같게 취급한다. */
export async function readDeviceUser(raw: string | undefined): Promise<DeviceUser | null> {
  if (!raw) return null

  try {
    const data = await unsealData<Partial<DeviceUser>>(raw, {
      password: sessionOptions.password as string,
    })
    if (!data?.user_id || !data?.couple_id) return null
    return { user_id: data.user_id, couple_id: data.couple_id }
  } catch {
    return null
  }
}
