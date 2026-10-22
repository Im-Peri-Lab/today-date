import { getCoupleById, type CoupleRow } from '@/lib/auth/couple'

/**
 * 미들웨어의 session_version 검증용 인메모리 캐시(couple_id → couples 행 또는 null).
 *
 * 보호 경로·API 요청마다 couples 를 DB 에서 다시 읽던 것을 TTL 안에서는 건너뛴다.
 * 알려진 한계(의도된 트레이드오프):
 *   - 패스코드 재설정(session_version +1) 후 다른 기기의 옛 세션이 인스턴스당 최대 TTL 동안
 *     유효하게 남을 수 있다. 서버리스 인스턴스끼리 캐시는 공유되지 않는다.
 *   - 계정 삭제로 커플이 사라진 경우(null)도 TTL 동안 같은 범위로 유지된다.
 *
 * 캐시는 "일치" 판정만 단축한다. 캐시 값과 쿠키 값이 다르면 만료 처리 전에 DB 를 한 번 더
 * 읽는다 — 재설정 직후 새 패스코드로 로그인해 발급된 새 쿠키(DB 의 새 버전)가, 옛 버전을
 * 들고 있는 캐시 때문에 불일치로 튕기는 일을 막기 위해서다. 조회 실패는 캐시하지 않고
 * 호출부로 던진다(호출부가 fail-open 으로 통과시킨다).
 */
export const SESSION_VERSION_TTL_MS = 15_000

/** 커플 수만큼만 쌓이지만 상한을 둔다 — 넘으면 만료된 항목부터 정리하고, 그래도 넘치면 비운다. */
const MAX_ENTRIES = 1000

type Entry = { couple: CoupleRow | null; expiresAt: number }

const cache = new Map<string, Entry>()

export type CoupleLoader = (coupleId: string) => Promise<CoupleRow | null>

function remember(coupleId: string, couple: CoupleRow | null, now: number) {
  if (cache.size >= MAX_ENTRIES) {
    cache.forEach((entry, key) => {
      if (entry.expiresAt <= now) cache.delete(key)
    })
    if (cache.size >= MAX_ENTRIES) cache.clear()
  }
  cache.set(coupleId, { couple, expiresAt: now + SESSION_VERSION_TTL_MS })
}

/**
 * 세션 쿠키의 sessionVersion 이 현재 커플의 session_version 과 일치하는가.
 * 커플 행이 없으면 false(기존과 동일). DB 조회가 실패하면 예외를 그대로 던진다.
 */
export async function isSessionVersionCurrent(
  coupleId: string,
  sessionVersion: number,
  deps: { load?: CoupleLoader; now?: () => number } = {}
): Promise<boolean> {
  const load = deps.load ?? getCoupleById
  const now = deps.now ?? Date.now

  const hit = cache.get(coupleId)
  if (hit && hit.expiresAt > now()) {
    // 일치하면 DB 없이 통과. 커플 부재(null)도 TTL 동안 그대로 "무효"로 유지한다.
    if (hit.couple === null) return false
    if (hit.couple.session_version === sessionVersion) return true
    // 불일치: 캐시가 낡았을 수 있으므로(재설정 직후 새로 발급된 쿠키) 아래에서 DB 로 재확인한다.
  }

  const couple = await load(coupleId)
  remember(coupleId, couple, now())
  return !!couple && couple.session_version === sessionVersion
}

/** 테스트용. */
export function clearSessionVersionCache() {
  cache.clear()
}
