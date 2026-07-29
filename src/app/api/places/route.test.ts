import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

/**
 * 검증(Zod)이 Supabase 호출보다 먼저 실패하는 경로만 다룬다 — 잘못된 입력은 DB에 닿기 전에
 * 400으로 끝나야 하므로, 이 테스트들은 SUPABASE_URL 등 환경변수 없이도 안정적으로 돈다.
 */
describe('GET /api/places — 쿼리 파라미터 검증', () => {
  it('유효하지 않은 status 값은 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/places?status=bogus')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('유효하지 않은 meal_time 값은 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/places?meal_time=brunch')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/places — 요청 본문 검증', () => {
  it('손상된 JSON 본문은 500이 아니라 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ this is not valid json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('meal_times가 빠지면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '망원동 파스타집', area: '망원동' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('category_id가 UUID 형식이 아니면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '망원동 파스타집',
        area: '망원동',
        meal_times: ['lunch'],
        category_id: 'not-a-uuid',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
