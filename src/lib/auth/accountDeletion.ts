import {
  deriveWorkspaceState,
  getCoupleById,
  getCoupleUsers,
} from '@/lib/auth/couple'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * SOLO 계정 삭제 — 커플 하나와 그에 딸린 모든 행을 지운다.
 *
 * 왜 필요한가: "상대가 먼저 혼자 가입해 버린" 경우를 사용자가 스스로 풀 방법이 없었다.
 * users.email 은 전역 unique 이고 초대 발송은 이미 가입된 이메일을 거부하므로
 * (§ lib/auth/invite.ts already_registered), 먼저 가입한 쪽이 빠져나오지 않으면 두 사람은
 * 영구히 합칠 수 없다. 이 경로는 그 사람이 자기 계정을 지우고 같은 이메일로 다시
 * 시작할 수 있게 한다 — 삭제 후 그 이메일은 users 에서 사라지므로 재가입도, 상대의
 * 초대 수락도 다시 가능해진다.
 *
 * SOLO 에서만 성립한다. PAIRED 는 "내 계정"이 곧 "우리 데이터"여서, 한 사람의 탈퇴가
 * 상대의 위시리스트까지 지우는 일이 된다 — 상대의 동의·데이터 승계·잔류 여부를
 * 결정해야 하는 별개의 문제이므로 이 경로에서는 열지 않고 차단한다.
 *
 * ⚠️ 이 파일이 지키는 단 하나의 불변식: **모든 DELETE 에 삭제 대상 커플 조건이 붙는다.**
 * coupleId 는 반드시 세션에서 온 값이어야 하고(§ lib/auth/coupleScope.ts) 요청 본문에서
 * 받아서는 안 된다. 조건이 하나라도 빠지면 그 문장은 전 커플의 행을 지운다 —
 * `.eq('couple_id', undefined)` 가 필터 없는 전체 삭제가 되는 것과 같은 사고다.
 */

/**
 * 도메인 데이터 3종 — couples 를 `on delete restrict` 로 참조한다(012).
 *
 * restrict 는 의도된 설계다("커플 행 삭제가 실데이터 대량 삭제로 번지는 것을 막는다 —
 * 커플 삭제 기능을 만들 때 명시적으로 데이터를 먼저 처리하도록 강제"). 그 강제의
 * 수취인이 바로 이 함수이므로, couples 보다 **먼저** 지운다. 순서를 뒤집으면 DB 가
 * 23503 으로 거부해 삭제가 통째로 실패한다.
 */
const RESTRICTED_DOMAIN_TABLES = ['activities', 'places', 'recommendations_log'] as const

/**
 * email_tokens 중 couple_id 가 아니라 target_email 로 이 커플에 묶이는 목적들.
 *
 * 015 가 넣은 email_tokens.couple_id 는 invite_partner 전용 스코프 컬럼이고, 나머지
 * 목적(verify_email / reset_passcode / change_email)은 couple_id 가 NULL 인 채
 * target_email → users → couple 로만 커플이 유도된다. users 행을 지우면 그 연결이
 * 끊어져 토큰만 영원히 남으므로, 사용자 이메일로 함께 정리한다.
 *
 * invite_partner 를 이 목록에서 **의도적으로 제외**한다: 그 목적의 행에서
 * target_email 은 "초대받는 사람"이고 소유자는 couple_id 쪽이다. 목적을 가리지 않고
 * target_email 로 지우면, 다른 커플이 이 이메일로 보낸 초대장(= 남의 커플의 행)까지
 * 지우게 된다. couple_id 가 이 커플인 invite_partner 행은 아래 1차 삭제가 이미 담당한다.
 */
const EMAIL_SCOPED_TOKEN_PURPOSES = [
  'verify_email',
  'reset_passcode',
  'change_email',
] as const

export type DeleteAccountFailure =
  /** 세션의 커플이 DB 에 없다(이미 지워졌거나 데이터가 어긋났다). */
  | 'not_found'
  /** 파트너가 있는 커플 — 이 경로의 범위 밖이다. */
  | 'paired'
  /** 조회·삭제 중 하나가 실패했다. 어디까지 지워졌는지는 deleted 로 보고한다. */
  | 'server_error'

/** 테이블별 삭제 행 수 — 서버 로그와 응답에 남겨 "무엇이 지워졌는가"를 추적 가능하게 한다. */
export type DeletedCounts = Record<string, number>

export type DeleteAccountResult =
  | { ok: true; deleted: DeletedCounts }
  | { ok: false; reason: DeleteAccountFailure; deleted?: DeletedCounts }

/**
 * DELETE 한 문장을 기다려 지워진 행 수를 돌려준다.
 *
 * 호출부가 `.select('id')` 를 붙여 삭제된 행을 실제로 받아온다
 * (Prefer: return=representation). PostgREST 의 DELETE 는 대상이 0건이어도 오류가
 * 아니므로, 개수를 받지 않으면 "조건이 빗나가 아무것도 못 지웠다"와 "지울 게 없었다"를
 * 구분할 수 없다 — 삭제 기능에서 그 둘을 뭉개면 검증 자체가 불가능해진다.
 */
async function countDeleted(
  table: string,
  query: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<number> {
  const { data, error } = await query

  if (error) throw new Error(`${table} 삭제 실패: ${error.message}`)

  return data?.length ?? 0
}

/**
 * 삭제 순서는 외래키가 정한다 — 바꾸면 DB 가 거부하거나 고아 행이 남는다.
 *
 *   1. activities / places / recommendations_log  (couples 를 restrict 로 참조 → 먼저)
 *   2. email_tokens (couple_id = 이 커플)          (cascade 지만 명시적으로 지운다)
 *   3. email_tokens (target_email = 이 커플 사용자, invite_partner 제외)
 *   4. users                                       (cascade 지만 명시적으로 지운다)
 *   5. couples                                     (마지막)
 *
 * 2·4 는 `on delete cascade` 라 5번에서 자동으로 사라지지만 직접 지운다. 이유가 두 가지다.
 * (a) 3번은 cascade 가 절대 손대지 않는다(couple_id 가 NULL 인 행) — 같은 자리에서 함께
 *     지워야 "무엇이 남는가"를 한눈에 검토할 수 있다.
 * (b) 삭제 범위를 DB 제약이 아니라 이 코드가 명시적으로 소유한다 — 나중에 cascade 가
 *     바뀌어도(또는 새 참조 테이블이 추가돼도) 이 목록이 정본으로 남는다.
 *
 * 트랜잭션이 없다는 점은 알려진 한계다. PostgREST 는 문장마다 별개 HTTP 요청이므로
 * 중간에 실패하면 앞 단계는 이미 커밋돼 있다. 부분 삭제를 없앨 수는 없으니, 부분 삭제로
 * 끝나도 **되돌아올 길이 남는 순서**를 골랐다:
 *
 *   - 4번 이전에 실패 → couples/users 가 그대로다. 세션도 살아 있어 그냥 다시 시도하면 된다.
 *   - 5번에서 실패 → users 는 이미 없고 커플 행만 남는다. 이 상태에서도 (a) 재시도가
 *     통하고(아래 PAIRED 만 차단하는 판정 덕분에 사용자 0명인 커플도 지울 수 있다),
 *     (b) 재가입도 통한다 — send-verify 가 사용자 없는 기존 커플을 재사용하므로
 *     같은 이메일로 다시 시작하면 그 커플을 그대로 물려받는다. 어느 쪽이든 막히지 않는다.
 *
 * 반대 순서(계정 먼저)라면 계정만 사라지고 데이터는 아무도 접근할 수 없는 채로 남는다.
 * 데이터 손실 대신 재시도를 택했다. 모든 단계가 멱등하므로(이미 지워진 행은 0건 삭제)
 * 재시도를 몇 번 해도 안전하다.
 */
export async function deleteSoloAccount(coupleId: string): Promise<DeleteAccountResult> {
  // 세션에서 온 값이라도 방어한다 — 빈 문자열이면 아래 모든 조건이 무력화된다.
  if (!coupleId) return { ok: false, reason: 'not_found' }

  const deleted: DeletedCounts = {}

  try {
    // ── 사전 판정 ──────────────────────────────────────────
    // 화면도 같은 판정으로 진입을 막지만(§ app/account/delete/page.tsx) 그건 화면
    // 정합성용이고, 삭제가 실제로 허용되는지는 여기서 한 번 더 본다. 초대 수락으로
    // PAIRED 가 되는 순간과 삭제 요청이 겹칠 수 있으므로 판정은 삭제 직전이어야 한다.
    const [couple, users] = await Promise.all([
      getCoupleById(coupleId),
      getCoupleUsers(coupleId),
    ])

    /*
     * 차단하는 것은 PAIRED 하나다 — 사용자가 2명이면 남의 데이터까지 지우는 일이 된다.
     *
     * 통과시키는 것은 "사용자 0~1명인 커플"이다. 1명이 정상 경로(SOLO)이고, 0명은
     * 5번에서 실패한 이전 시도가 남긴 커플 행이다(위 부분 삭제 근거). 그 상태를
     * not_found 로 닫으면 재시도가 영구히 막히고 고아 행이 남으므로 함께 지운다 —
     * 삭제 범위는 어차피 전부 이 커플로 한정돼 있어 넓어지지 않는다.
     */
    if (deriveWorkspaceState(couple, users) === 'PAIRED') {
      return { ok: false, reason: 'paired' }
    }
    // 커플 행 자체가 없으면 지울 대상이 없다.
    if (!couple) return { ok: false, reason: 'not_found' }

    // users 행을 지우기 전에 이메일을 확보한다 — 3번 삭제의 유일한 단서다.
    const emails = users.map((u) => u.email)
    const supabase = getSupabaseClient()

    // ── 1. 도메인 데이터 (restrict → 반드시 couples 보다 먼저) ──
    for (const table of RESTRICTED_DOMAIN_TABLES) {
      deleted[table] = await countDeleted(
        table,
        supabase.from(table).delete().eq('couple_id', coupleId).select('id')
      )
    }

    // ── 2. 이 커플이 보낸 파트너 초대 ──
    deleted['email_tokens.couple'] = await countDeleted(
      'email_tokens',
      supabase.from('email_tokens').delete().eq('couple_id', coupleId).select('id')
    )

    // ── 3. 이 커플 사용자의 이메일 인증·재설정 토큰 ──
    // 목적을 in() 으로 못박는다 — invite_partner 를 제외하는 것이 핵심이다(위 상수 주석).
    // 이메일이 없으면(SOLO 판정을 통과했으므로 있을 수 없지만) 문장 자체를 보내지 않는다:
    // `in('target_email', [])` 이 어떻게 해석되든 무조건 0건이어야 하는 자리다.
    deleted['email_tokens.email'] =
      emails.length === 0
        ? 0
        : await countDeleted(
            'email_tokens',
            supabase
              .from('email_tokens')
              .delete()
              .in('target_email', emails)
              .in('purpose', [...EMAIL_SCOPED_TOKEN_PURPOSES])
              .select('id')
          )

    // ── 4. 사용자 행 ──
    deleted['users'] = await countDeleted(
      'users',
      supabase.from('users').delete().eq('couple_id', coupleId).select('id')
    )

    // ── 5. 커플 행 ──
    // 여기까지 restrict 참조가 모두 정리됐으므로 통과한다. 남아 있었다면 23503 으로
    // 실패하고 위 단계들은 이미 커밋된 상태가 된다 — 그때도 계정은 살아 있어 재시도 가능하다.
    deleted['couples'] = await countDeleted(
      'couples',
      supabase.from('couples').delete().eq('id', coupleId).select('id')
    )

    if (deleted['couples'] === 0) {
      // 조건에 맞는 커플이 0건 — 동시에 다른 요청이 지웠거나 id 가 어긋났다.
      // 데이터는 이미 지워졌으므로 성공으로 위장하지 않고 그대로 알린다.
      return { ok: false, reason: 'server_error', deleted }
    }

    return { ok: true, deleted }
  } catch (err) {
    console.error('[deleteSoloAccount] 삭제 실패', { coupleId, deleted, err })
    return { ok: false, reason: 'server_error', deleted }
  }
}
