import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Next.js가 fetch()를 자동으로 데이터 캐시에 태우는데, 라우트의 `dynamic = 'force-dynamic'`만으로는
 * supabase-js 내부 fetch 호출까지 캐시 해제가 안 되는 경우가 확인됨(place_categories가 마이그레이션
 * 이후에도 계속 예전 응답을 반환 — Supabase API 로그에 실제 요청 자체가 안 잡힘).
 * 클라이언트가 쓰는 fetch에 직접 no-store를 박아 모든 쿼리를 항상 최신 상태로 강제한다.
 */
function noStoreFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, cache: 'no-store' })
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false }, global: { fetch: noStoreFetch } }
    )
  }
  return client
}
