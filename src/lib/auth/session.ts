import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  authenticated: boolean
  lastVerifiedAt: number
  sessionVersion: number
  /**
   * 세션 주체 — couples/users 전환으로 추가된 필드.
   *
   * couple_id 는 인증 상태(패스코드/잠금/session_version)의 소유자이고,
   * user_id 는 그 커플 안에서 이 세션이 누구인지를 가리킨다. 두 필드가 없는 쿠키는
   * 전환 이전에 발급된 세션이므로 미들웨어가 만료로 처리한다(src/middleware.ts).
   *
   * 필드명은 DB 컬럼(couples.id / users.id)과 1:1로 읽히도록 스네이크 케이스를 유지한다.
   */
  user_id: string
  couple_id: string
}

export const sessionOptions: SessionOptions = {
  cookieName: 'today-date-session',
  password: process.env.SESSION_SECRET!,
  ttl: 30 * 24 * 60 * 60, // 30일
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
