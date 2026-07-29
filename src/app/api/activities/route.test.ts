import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

/**
 * 검증(Zod)이 Supabase 호출보다 먼저 실패하는 경로만 다룬다 — 잘못된 입력은 DB에 닿기 전에
 * 400으로 끝나야 하므로, 이 테스트들은 SUPABASE_URL 등 환경변수 없이도 안정적으로 돈다.
 */
describe('GET /api/activities — 쿼리 파라미터 검증', () => {
  it('유효하지 않은 status 값은 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities?status=bogus')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  it('유효하지 않은 duration_bucket 값은 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities?duration_bucket=forever')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('유효하지 않은 location_type 값은 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities?location_type=space')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/activities — 요청 본문 검증', () => {
  it('손상된 JSON 본문은 500이 아니라 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ this is not valid json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('필수 필드가 빠진 본문은 400을 반환하고 사유를 메시지로 담는다', async () => {
    const req = new NextRequest('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
    expect(Array.isArray(json.details)).toBe(true)
  })

  it('category_id가 UUID 형식이 아니면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '한강 자전거',
        location_type: 'outdoor',
        duration_bucket: 'half',
        category_id: 'not-a-uuid',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
