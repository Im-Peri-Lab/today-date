import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

/**
 * POST/PATCH 본문 JSON 파싱 — 손상된 JSON·빈 본문은 이전엔 `req.json()`이 던진 SyntaxError가
 * 라우트의 바깥 try/catch에 잡혀 그대로 500(서버 오류)으로 나갔다. 이는 클라이언트 입력 문제이지
 * 서버 오류가 아니므로 여기서 미리 잡아 400으로 정규화한다.
 */
export async function readJsonBody(
  req: Request
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: await req.json() }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: '요청 본문이 올바른 JSON 형식이 아닙니다.' },
        { status: 400 }
      ),
    }
  }
}

/** Zod safeParse 실패 결과를 4개 라우트가 동일하게 쓰던 400 오류 응답 형태로 변환. */
export function zodErrorResponse(error: ZodError): NextResponse {
  const message = error.issues[0]?.message ?? '입력값이 올바르지 않습니다.'
  return NextResponse.json({ error: message, details: error.issues }, { status: 400 })
}
