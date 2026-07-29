import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH } from './route'

const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' })

/** Zod 검증이 Supabase 호출보다 먼저 실패하는 경로만 다룬다(§ activities/route.test.ts와 동일 취지). */
describe('PATCH /api/activities/[id] — 요청 본문 검증', () => {
  it('손상된 JSON 본문은 500이 아니라 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not valid json',
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })

  it('유효하지 않은 status 값은 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'bogus' }),
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })

  it('rating이 범위를 벗어나면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 6 }),
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })

  it('종료일이 시작일보다 빠르면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/activities/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visited_at: '2026-01-10', visited_end_at: '2026-01-05' }),
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })
})
