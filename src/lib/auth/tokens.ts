import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseClient } from '@/lib/supabase/client'

export type TokenPurpose =
  | 'verify_email'
  | 'reset_passcode'
  | 'change_email'
  | 'invite_partner'

/** 파트너 초대 링크 유효 시간 — 24시간(분 단위). */
export const INVITE_EXPIRY_MINUTES = 24 * 60

export interface TokenRow {
  id: string
  target_email: string
  /**
   * 초대를 보낸 커플. invite_partner 목적 행에만 채워지고 그 외 목적은 null 이다(015).
   * 수락 처리가 "어느 커플에 붙일지"를 이 값으로만 결정한다 — target_email 은 아직
   * users 에 없으므로 커플을 유도할 다른 단서가 없다.
   */
  couple_id: string | null
}

export async function createToken(
  purpose: TokenPurpose,
  targetEmail: string,
  expiresInMinutes = 60,
  /** invite_partner 전용. 그 외 목적에서는 넘기지 않는다(NULL 로 남는다). */
  coupleId: string | null = null
): Promise<string> {
  const supabase = getSupabaseClient()

  // 기존 미사용 토큰 삭제 (중복 방지)
  await supabase
    .from('email_tokens')
    .delete()
    .eq('purpose', purpose)
    .eq('target_email', targetEmail)
    .is('used_at', null)

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()

  const { error } = await supabase.from('email_tokens').insert({
    token_hash: tokenHash,
    purpose,
    target_email: targetEmail,
    expires_at: expiresAt,
    couple_id: coupleId,
  })

  if (error) throw new Error(`토큰 생성 실패: ${error.message}`)

  return rawToken
}

export async function verifyToken(
  rawToken: string,
  purpose: TokenPurpose
): Promise<TokenRow | null> {
  const supabase = getSupabaseClient()

  const { data: tokens } = await supabase
    .from('email_tokens')
    .select('id, token_hash, target_email, couple_id')
    .eq('purpose', purpose)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  if (!tokens || tokens.length === 0) return null

  for (const token of tokens) {
    const match = await bcrypt.compare(rawToken, token.token_hash)
    if (match) {
      return {
        id: token.id,
        target_email: token.target_email,
        couple_id: token.couple_id ?? null,
      }
    }
  }

  return null
}

export async function markTokenUsed(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase
    .from('email_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', id)
}

/**
 * 이 이메일로 대기 중인 파트너 초대를 찾는다(원문 토큰 없이).
 *
 * 자가가입 경로(/api/auth/setup/send-verify)가 "이미 초대받은 사람인지"를 판별하는 데 쓴다.
 * 토큰 원문은 메일함에만 있으므로 여기서는 해시 비교를 하지 않는다 — 초대의 존재와
 * 그 초대를 보낸 커플만 알아내면 충분하다.
 */
export async function findPendingInvite(
  targetEmail: string
): Promise<TokenRow | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('email_tokens')
    .select('id, target_email, couple_id')
    .eq('purpose', 'invite_partner')
    .eq('target_email', targetEmail)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw new Error(`email_tokens 조회 실패: ${error.message}`)
  if (!data || data.length === 0) return null

  const row = data[0] as { id: string; target_email: string; couple_id: string | null }
  return { id: row.id, target_email: row.target_email, couple_id: row.couple_id ?? null }
}

/**
 * 이 커플이 보낸 대기 중 파트너 초대를 모두 무효화한다(재초대 직전에 호출).
 *
 * createToken() 의 중복 정리는 (purpose, target_email) 기준이라, 초대 대상 이메일을
 * 바꿔 다시 초대하면 먼저 보낸 초대가 그대로 살아남는다 — 그 링크로도 커플에
 * 합류할 수 있으므로 초대장이 사실상 두 장이 된다. 커플 단위로 먼저 지워
 * "유효한 초대는 항상 최대 한 장"을 유지한다.
 *
 * 폐기 방식은 삭제다(used_at 표시가 아니라). 쓰이지 않은 초대는 감사 가치가 없고,
 * verifyToken 이 used_at IS NULL 만 보므로 삭제가 가장 확실한 무효화다.
 */
export async function revokePendingInvites(coupleId: string): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('email_tokens')
    .delete()
    .eq('purpose', 'invite_partner')
    .eq('couple_id', coupleId)
    .is('used_at', null)

  if (error) throw new Error(`기존 초대 무효화 실패: ${error.message}`)
}
