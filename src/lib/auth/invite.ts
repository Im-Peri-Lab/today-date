import {
  addCoupleUser,
  deriveWorkspaceState,
  getCoupleById,
  getCoupleUsers,
  getUserByEmail,
  type CoupleUserRow,
} from '@/lib/auth/couple'
import {
  INVITE_EXPIRY_MINUTES,
  createToken,
  markTokenUsed,
  revokePendingInvites,
  verifyToken,
} from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/resend'
import { getInvitePartnerTemplate } from '@/lib/email/templates'

/**
 * 파트너 초대 — SOLO → PAIRED 전환의 두 반쪽(발송·수락)을 한 곳에 모은다.
 *
 * 라우트가 아니라 이 계층에 두는 이유: 발송은 두 진입점에서 쓰인다
 * (POST /api/auth/invite = 본인이 보내는 초대,
 *  POST /api/auth/setup/send-verify = 이미 초대받은 사람이 자가가입을 시도한 경우의 재발송).
 * 두 곳이 각자 중복 검사·토큰 폐기·메일 발송을 다시 구현하면 한쪽만 고쳐지는 순간
 * 가드가 반쪽만 남는다.
 *
 * 실패 사유는 문자열 코드로 돌려준다 — 화면(리다이렉트 쿼리)과 API(JSON 오류)가
 * 같은 판정을 서로 다른 문구로 표현해야 하기 때문이다.
 */

export type InviteFailure =
  /** 그 이메일이 이미 어느 users 행에 존재한다. */
  | 'already_registered'
  /** 이 커플에는 이미 두 사람이 있다 — 초대할 자리가 없다. */
  | 'already_paired'
  /** 토큰이 없거나 만료·사용됨, 또는 초대한 커플이 사라졌다. */
  | 'invalid_token'
  /** 커플 행/사용자 행 조회·삽입이 실패했다. */
  | 'server_error'

export type SendInviteResult =
  | { ok: true }
  | { ok: false; reason: InviteFailure }

export type AcceptInviteResult =
  | { ok: true; user: CoupleUserRow; coupleId: string }
  | { ok: false; reason: InviteFailure }

/** 초대 링크 — 토큰을 쿼리로 실어 보낸다. 이 경로는 미들웨어 OPEN_PREFIXES 에 있다. */
function buildInviteUrl(rawToken: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${rawToken}`
}

/**
 * 초대 발송.
 *
 * 순서가 중요하다:
 *   1. PAIRED 차단  — 초대할 자리가 없는 커플은 토큰조차 만들지 않는다.
 *   2. 중복 이메일 차단 — 다른 커플(또는 본인)에 이미 등록된 이메일이면 발송하지 않는다.
 *      users.email 이 전역 unique 라 수락 단계에서 어차피 실패할 초대를 보내지 않는 것이고,
 *      더 중요하게는 남의 계정 이메일로 초대 메일이 날아가는 일을 막는다.
 *   3. 기존 대기 초대 폐기 — 유효한 초대는 항상 최대 한 장.
 *   4. 토큰 생성(24시간) → 메일 발송.
 *
 * 메일 발송 실패는 실패로 취급하지 않는다(false 를 돌리지 않는다) — 토큰은 이미
 * 만들어졌고, 발송 인프라 장애로 "초대가 안 됐다"고 안내하면 사용자가 재시도해
 * 방금 만든 토큰을 다시 폐기하는 루프에 빠진다. 기존 send-verify 와 같은 판단이다.
 */
export async function sendPartnerInvite(opts: {
  coupleId: string
  targetEmail: string
}): Promise<SendInviteResult> {
  const { coupleId, targetEmail } = opts

  const couple = await getCoupleById(coupleId)
  if (!couple) return { ok: false, reason: 'server_error' }

  const users = await getCoupleUsers(coupleId)
  if (deriveWorkspaceState(couple, users) === 'PAIRED') {
    return { ok: false, reason: 'already_paired' }
  }

  const existing = await getUserByEmail(targetEmail)
  if (existing) return { ok: false, reason: 'already_registered' }

  await revokePendingInvites(coupleId)

  const rawToken = await createToken(
    'invite_partner',
    targetEmail,
    INVITE_EXPIRY_MINUTES,
    coupleId
  )

  // 초대한 사람을 메일에 밝힌다 — 모르는 사람의 초대를 누르는 일이 없어야 한다.
  // users 가 비어 있는 커플은 위 PAIRED 판정에서 걸러지지 않으므로(NONE) 방어적으로 처리한다.
  const inviterEmail = users[0]?.email ?? ''

  const emailResult = await sendEmail({
    to: targetEmail,
    subject: '[Today Date] 파트너 초대',
    html: getInvitePartnerTemplate(buildInviteUrl(rawToken), inviterEmail),
  })

  if (!emailResult.success) {
    console.error('[invite] email failed:', emailResult.error)
  }

  return { ok: true }
}

/**
 * 초대 수락.
 *
 * 토큰 검증을 통과한 뒤에도 두 가지를 다시 본다:
 *   - 커플이 그 사이 PAIRED 가 됐는지(같은 초대 링크를 두 번 열었거나, 다른 초대가 먼저 성립)
 *   - 그 이메일이 그 사이 다른 계정에 가입됐는지(경쟁 상황)
 * 발송 시점의 검사를 신뢰하지 않는다 — 초대 링크는 24시간 유효하고 그 사이 상태가 바뀐다.
 *
 * 성공 시 users 행을 email_verified=true 로 만든다: 초대 링크를 열었다는 사실 자체가
 * 그 메일함의 소유 증명이므로 인증 메일을 한 번 더 보내지 않는다. 패스코드는 새로
 * 설정하지 않는다 — 커플의 기존 passcode_hash 를 그대로 쓴다.
 */
export async function acceptPartnerInvite(rawToken: string): Promise<AcceptInviteResult> {
  const tokenRow = await verifyToken(rawToken, 'invite_partner')
  if (!tokenRow?.couple_id) return { ok: false, reason: 'invalid_token' }

  const couple = await getCoupleById(tokenRow.couple_id)
  // 패스코드가 없는 커플에 합류시키면 /lock 에서 들어갈 방법이 없다(unlock 이 403).
  if (!couple?.passcode_hash) return { ok: false, reason: 'invalid_token' }

  const users = await getCoupleUsers(couple.id)
  if (deriveWorkspaceState(couple, users) === 'PAIRED') {
    return { ok: false, reason: 'already_paired' }
  }

  const existing = await getUserByEmail(tokenRow.target_email)
  if (existing) return { ok: false, reason: 'already_registered' }

  const user = await addCoupleUser(couple.id, tokenRow.target_email, true)
  // users.email 전역 unique 위반(위 검사와 삽입 사이의 경쟁)도 여기로 온다.
  if (!user) return { ok: false, reason: 'already_registered' }

  // 토큰은 사용 완료로 표시한다(폐기가 아니라) — 수락된 초대는 감사 가치가 있고,
  // verifyToken 이 used_at IS NULL 만 보므로 같은 링크의 재사용은 이 시점부터 막힌다.
  await markTokenUsed(tokenRow.id)

  return { ok: true, user, coupleId: couple.id }
}
