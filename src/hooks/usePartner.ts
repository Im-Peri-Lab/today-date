'use client'

import { useQuery } from '@tanstack/react-query'
import type { PartnerInfo } from '@/lib/auth/partner'
import { fetchJson } from './fetcher'

/**
 * 세션 커플의 파트너 — 삼선 메뉴(HomeMenu)가 "파트너" 항목 노출을 결정하는 데 쓴다.
 *
 * 서버 컴포넌트가 내려주는 prop 이 아니라 클라이언트 조회인 이유: 메뉴는
 * PageHeader 를 쓰는 모든 화면(홈·목록·오류 경계)에 얹히고, 그중 오류 경계는
 * 서버 데이터를 받을 수 없다. 상태 판정의 출처를 한 곳(/api/partner)으로 두면
 * 화면마다 prop 을 이어 내리지 않아도 모든 헤더가 같은 답을 본다.
 *
 * type-only import 라 서버 모듈(@/lib/auth/partner)은 번들에 들어가지 않는다.
 */
export function usePartner() {
  return useQuery({
    queryKey: ['partner'],
    queryFn: async () => fetchJson<{ partner: PartnerInfo | null }>('/api/partner'),
    // 파트너 수는 초대 수락 시점에만 바뀐다 — 화면 이동마다 다시 물을 값이 아니다.
    staleTime: 5 * 60_000,
  })
}
