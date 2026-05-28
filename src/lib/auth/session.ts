import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  authenticated: boolean
  lastVerifiedAt: number
  sessionVersion: number
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
