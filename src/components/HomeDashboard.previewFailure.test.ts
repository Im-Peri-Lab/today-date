import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// 이 테스트와 무관한 FAB(드롭다운, SSR 경고 발생)는 비운다.
vi.mock('@/components/HomeFab', () => ({ HomeFab: () => null }))

// 컴포넌트가 classic JSX 런타임(React 전역)으로 컴파일되므로 테스트 환경에 React 를 노출한다.
;(globalThis as { React?: typeof React }).React = React

const { HomeDashboard } = await import('./HomeDashboard')
import type { DashboardStats } from '@/hooks/useDashboardStats'

/** getDashboardStats 가 미리보기 쿼리만 실패했을 때의 반환값 — 개수는 있고 제목·미리보기는 비어 있다. */
const previewsFailed: DashboardStats = {
  wishlistActivities: 3,
  wishlistPlaces: 1,
  visitedActivities: 2,
  visitedPlaces: 5,
  wishlistActivityTitles: [],
  wishlistActivityPreviews: [],
  wishlistPlaceTitles: [],
  wishlistPlacePreviews: [],
  visitedActivityTitles: [],
  visitedActivityPreviews: [],
  visitedPlaceTitles: [],
  visitedPlacePreviews: [],
}

function render(stats: DashboardStats): string {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(HomeDashboard, { initialStats: stats, workspaceState: 'PAIRED' })
    )
  )
}

describe('HomeDashboard — 미리보기만 실패한 상태', () => {
  // 헤더 메뉴(base-ui 드롭다운)가 서버 렌더에서 내는 useLayoutEffect 경고는 이 테스트와 무관하다.
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const html = render(previewsFailed)
  spy.mockRestore()

  it('깨진 문구가 나오지 않는다', () => {
    expect(html).not.toMatch(/undefined|NaN|null/)
    expect(html).not.toContain('외 ')
  })

  it('개수는 제목 줄에 타일당 한 번만 표시되고 본문에 "외 N개"·별도 폴백 개수는 없다', () => {
    for (const text of ['3개', '1곳', '2개', '5곳']) {
      // 제목 옆 개수(모바일·PC 공통) 한 번 — 본문 폴백 개수가 있으면 2번이 된다
      expect(html.split(`>${text}<`).length - 1).toBe(1)
    }
    expect(html).not.toMatch(/외\s*\d/)
    expect(html).not.toContain('FallbackCount')
  })

  it('"아직 담은/다녀온 곳이 없어요" 빈 상태로 오인되지 않는다', () => {
    expect(html).not.toContain('곳이 없어요')
  })
})
