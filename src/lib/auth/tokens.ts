import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseClient } from '@/lib/supabase/client'

export type TokenPurpose = 'verify_email' | 'reset_passcode' | 'change_email'

export async function createToken(
  purpose: TokenPurpose,
  targetEmail: string,
  expiresInMinutes = 60
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
  })

  if (error) throw new Error(`토큰 생성 실패: ${error.message}`)

  return rawToken
}

export async function verifyToken(
  rawToken: string,
  purpose: TokenPurpose
): Promise<{ id: string; target_email: string } | null> {
  const supabase = getSupabaseClient()

  const { data: tokens } = await supabase
    .from('email_tokens')
    .select('id, token_hash, target_email')
    .eq('purpose', purpose)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  if (!tokens || tokens.length === 0) return null

  for (const token of tokens) {
    const match = await bcrypt.compare(rawToken, token.token_hash)
    if (match) {
      return { id: token.id, target_email: token.target_email }
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
