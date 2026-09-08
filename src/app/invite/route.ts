import { NextRequest, NextResponse } from 'next/server'
import { acceptPartnerInvite, type InviteFailure } from '@/lib/auth/invite'
import {
  PENDING_USER_COOKIE,
  PENDING_USER_MAX_AGE,
  sealPendingUser,
} from '@/lib/auth/pendingUser'

/**
 * 초대 수락 진입점 — 메일의 "초대 수락하기" 버튼이 여는 GET 링크.
 *
 * 페이지(page.tsx)가 아니라 라우트 핸들러인 이유: 수락은 쿠키를 심어야 하고
 * (다음 잠금해제를 새 user_id 로 발급하기 위한 pending-user 쪽지),
 * Next 14 의 서버 컴포넌트는 렌더 중 쿠키를 쓸 수 없다. /setup/verify 는 쿠키가
 * 필요 없어 서버 컴포넌트로 둘 수 있었지만 이 경로는 그럴 수 없다.
 *
 * GET 이 상태를 바꾸는 것은 이메일 링크 클릭이 GET 이기 때문이며
 * (/setup/verify 도 같다), 재실행은 토큰의 used_at 으로 막힌다.
 *
 * 결과는 언제나 /lock 으로 보낸다 — 성공이든 실패든 초대받은 사람이 다음에 할 일은
 * 패스코드 입력이거나 화면을 떠나는 것이고, 그 안내를 잠금 화면이 함께 한다.
 * 실패 사유를 쿼리로 넘겨 /lock 이 문구를 고른다(src/app/lock/page.tsx).
 */

const FAILURE_QUERY: Record<InviteFailure, string> = {
  invalid_token: 'invalid',
  already_registered: 'registered',
  already_paired: 'paired',
  server_error: 'error',
}

/**
 * /lock 으로 보내는 리다이렉트.
 *
 * Location 을 상대 경로로 준다 — NextResponse.redirect() 가 요구하는 절대 URL 을
 * `new URL('/lock', req.url)` 로 만들면 라우트 핸들러의 req.url 이 실제 요청 호스트가
 * 아니라 Next 내부 주소(localhost:PORT)를 가리켜 리다이렉트가 다른 오리진으로 나간다.
 * 그러면 이 응답에 실은 pending-user 쿠키가 도착지에서 전송되지 않아
 * (127.0.0.1 에 심긴 쿠키를 localhost 가 못 읽는다) 초대받은 사람이 파트너의 user_id 로
 * 세션을 받는다 — e2e 가 세션 쿠키의 user_id 를 직접 열어 이 회귀를 잡았다.
 * 상대 Location 은 브라우저가 요청 URL 기준으로 해석하므로 오리진이 그대로 유지된다.
 */
function redirectToLock(query: string) {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: `/lock?${query}` },
  })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return redirectToLock('invite=invalid')
  }

  try {
    const result = await acceptPartnerInvite(token)

    if (!result.ok) {
      return redirectToLock(`invite=${FAILURE_QUERY[result.reason]}`)
    }

    // 합류 완료. 세션은 아직 없다 — 커플의 기존 패스코드를 /lock 에서 입력해야 발급된다.
    // 그 잠금해제가 "먼저 만들어진 사용자"가 아니라 방금 합류한 이 사람으로 세션을
    // 발급하도록, 서버가 서명한 쪽지를 남긴다(src/lib/auth/pendingUser.ts).
    const res = redirectToLock('joined=1')
    res.cookies.set(PENDING_USER_COOKIE, await sealPendingUser({
      user_id: result.user.id,
      couple_id: result.coupleId,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: PENDING_USER_MAX_AGE,
      path: '/',
    })

    return res
  } catch (e) {
    console.error('[GET /invite]', e)
    return redirectToLock('invite=error')
  }
}
