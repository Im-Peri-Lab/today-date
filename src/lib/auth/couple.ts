import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * 인증의 단일 출처인 couples/users 조회·갱신 계층.
 *
 * app_config(단일 row)에서 couples/users(다중 row)로 옮겨온 뒤의 유일한 접근 경로다.
 * app_config 는 동결된 백업으로 DB 에만 남아 있고 앱 코드는 읽지도 쓰지도 않는다.
 *
 * 커플을 특정하는 방법은 세 가지뿐이고 아래 함수가 각각에 대응한다 —
 * id=1 같은 고정 키는 어디에서도 쓰지 않는다.
 *   1. 세션의 couple_id           → getCoupleById()
 *   2. 이메일(가입/재설정 링크)     → getUserByEmail() → getCoupleById()
 *   3. 식별자가 없는 요청           → getSoleCouple()  (잠금해제·패스코드 설정)
 */

export interface CoupleRow {
  id: string
  passcode_hash: string | null
  failed_attempts: number
  locked_until: string | null
  session_version: number
}

export interface CoupleUserRow {
  id: string
  couple_id: string
  email: string
  email_verified: boolean
}

const COUPLE_COLUMNS = 'id, passcode_hash, failed_attempts, locked_until, session_version'
const USER_COLUMNS = 'id, couple_id, email, email_verified'

/**
 * 워크스페이스 상태.
 *   NONE   — 커플이 없다(또는 커플 행만 있고 사용자가 없다). 최초 설정 대상.
 *   SOLO   — 커플 1개 + 사용자 1명. 현재 프로덕션 상태.
 *   PAIRED — 커플 1개 + 사용자 2명. 초대가 성립한 뒤에만 도달한다.
 */
export type WorkspaceState = 'NONE' | 'SOLO' | 'PAIRED'

export async function getCoupleById(coupleId: string): Promise<CoupleRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('couples')
    .select(COUPLE_COLUMNS)
    .eq('id', coupleId)
    .maybeSingle()

  // 조회 실패와 "행이 없음"을 구분한다 — null 은 행이 정말 없다는 뜻이어야 하고,
  // 일시적 DB 오류가 "커플 없음"으로 읽혀 인증 판단이 뒤집히면 안 된다.
  if (error) throw new Error(`couples 조회 실패: ${error.message}`)

  return (data as CoupleRow | null) ?? null
}

/**
 * 커플이 정확히 1개일 때만 그 커플을 반환한다.
 *
 * 잠금해제(/api/auth/unlock)와 패스코드 설정(/api/auth/setup/passcode)은 요청에
 * 이메일이 없어 커플을 특정할 단서가 없다. 0개거나 2개 이상이면 null 을 반환해
 * 호출부가 403 으로 닫히게 한다 — 커플을 임의로 골라 인증을 통과시키는 일은 없다.
 *
 * TODO(초대 기능 청크): 커플이 여러 개가 되는 시점에는 잠금 화면이 이메일을 함께
 * 받아 getUserByEmail() 로 커플을 특정해야 한다. 그때까지 이 함수가 유일한 경로다.
 */
export async function getSoleCouple(): Promise<CoupleRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('couples')
    .select(COUPLE_COLUMNS)
    .order('created_at', { ascending: true })
    .limit(2)

  if (error) throw new Error(`couples 조회 실패: ${error.message}`)
  if (!data || data.length !== 1) return null
  return data[0] as CoupleRow
}

export async function getUserByEmail(email: string): Promise<CoupleUserRow | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLUMNS)
    .eq('email', email)
    .maybeSingle()

  if (error) throw new Error(`users 조회 실패: ${error.message}`)

  return (data as CoupleUserRow | null) ?? null
}

/** 커플에 속한 사용자 전원. created_at 오름차순 — 세션 사용자 선택을 결정적으로 만든다. */
export async function getCoupleUsers(coupleId: string): Promise<CoupleUserRow[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLUMNS)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`users 조회 실패: ${error.message}`)

  return (data as CoupleUserRow[] | null) ?? []
}

/**
 * 세션에 담을 사용자를 고른다 — 인증된 사용자 중 가장 먼저 생성된 사람.
 *
 * 패스코드는 커플 단위로 하나이므로 잠금해제 요청만으로는 두 파트너 중 누가
 * 들어왔는지 알 수 없다. SOLO 에서는 후보가 1명이라 모호함이 없다.
 *
 * TODO(초대 기능 청크): PAIRED 에서 파트너를 구분하려면 잠금 화면이 이메일을
 * 받거나 파트너별 자격증명이 필요하다. 지금은 커플 단위 인증으로만 동작한다.
 */
export function pickSessionUser(users: CoupleUserRow[]): CoupleUserRow | null {
  return users.find((u) => u.email_verified) ?? null
}

/**
 * 이메일 인증 완료 표시. 대상 사용자가 없으면 false —
 * 인증 링크의 target_email 에 해당하는 users 행이 사라진 경우다.
 * (POST /api/auth/setup/verify 와 /setup/verify 페이지가 함께 쓴다.)
 */
export async function markUserEmailVerified(email: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .update({ email_verified: true })
    .eq('email', email)
    .select('id')

  if (error) throw new Error(`users 갱신 실패: ${error.message}`)

  return (data?.length ?? 0) > 0
}

export function deriveWorkspaceState(
  couple: CoupleRow | null,
  users: CoupleUserRow[]
): WorkspaceState {
  if (!couple || users.length === 0) return 'NONE'
  if (users.length >= 2) return 'PAIRED'
  return 'SOLO'
}

/**
 * 설정 완료 판정 — app_config 시절의 `email_verified && passcode_hash` 와 같은 의미다.
 * (recovery_email/email_verified 는 users 로, passcode_hash 는 couples 로 나뉘었다.)
 */
export function isSetupComplete(couple: CoupleRow | null, users: CoupleUserRow[]): boolean {
  if (!couple?.passcode_hash) return false
  return users.some((u) => u.email_verified)
}

export interface WorkspaceStatus {
  /** 커플을 특정할 수 없으면(=커플이 2개 이상) null — 그때 라우팅은 setupComplete 만으로 결정한다. */
  state: WorkspaceState | null
  couple: CoupleRow | null
  users: CoupleUserRow[]
  setupComplete: boolean
}

/**
 * 단일 커플 워크스페이스의 상태를 한 번에 판별한다(미들웨어의 설정 완료 게이트용).
 */
export async function getWorkspaceStatus(): Promise<WorkspaceStatus> {
  const supabase = getSupabaseClient()
  const { data: couples, error } = await supabase
    .from('couples')
    .select(COUPLE_COLUMNS)
    .order('created_at', { ascending: true })
    .limit(2)

  if (error) throw new Error(`couples 조회 실패: ${error.message}`)

  if (!couples || couples.length === 0) {
    return { state: 'NONE', couple: null, users: [], setupComplete: false }
  }

  // 커플이 2개 이상이면 식별자 없이는 어느 커플의 상태인지 판별할 수 없다.
  // 다만 커플이 여럿 존재한다는 것 자체가 최초 설정이 끝났다는 뜻이므로 설정 게이트는 통과시킨다.
  if (couples.length > 1) {
    return { state: null, couple: null, users: [], setupComplete: true }
  }

  const couple = couples[0] as CoupleRow
  const users = await getCoupleUsers(couple.id)

  return {
    state: deriveWorkspaceState(couple, users),
    couple,
    users,
    setupComplete: isSetupComplete(couple, users),
  }
}
