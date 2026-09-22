import { NextResponse } from 'next/server'
import { DEVICE_USER_COOKIE } from '@/lib/auth/deviceUser'
import { getSession } from '@/lib/auth/session'

export async function POST() {
  try {
    const session = await getSession()
    session.destroy()

    const res = NextResponse.json({ success: true })

    /*
     * 기기 기억("이 브라우저는 두 파트너 중 이 사람")도 함께 지운다.
     *
     * 세션 만료(30일)와 명시적 로그아웃을 의도적으로 다르게 취급한다:
     *   - 만료는 "시간이 지났다"일 뿐이므로 기억을 남긴다 → 재로그인은 패스코드만.
     *   - 로그아웃은 "이 기기에서 나는 더 이상 로그인 상태가 아니다"라는 선언이므로
     *     기억도 함께 끊는다 → 다음 로그인 때 누구인지 다시 확인한다(PAIRED 만).
     *
     * 그래서 한 기기를 두 사람이 번갈아 쓰는 경우의 전환 수단이 로그아웃이 된다 —
     * 잠금 화면에 "다른 사람으로 로그인" 같은 항목을 상시 노출하지 않아도 된다
     * (§ lib/auth/deviceUser.ts, app/api/auth/unlock/route.ts).
     */
    res.cookies.delete(DEVICE_USER_COOKIE)

    return res
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
