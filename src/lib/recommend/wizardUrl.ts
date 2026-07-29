/** 활동/다이닝 위저드가 공통으로 쓰는 카테고리 id 쿼리 파서 (예: "a,b,c" → ["a","b","c"]). */
export function parseCategoryIdsParam(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : []
}

// 단계 전환은 실제 화면 전환에 대응하므로 next/navigation 라우터(RSC 재요청 유발) 대신
// 히스토리 API를 직접 사용해 엔트리를 쌓는다 — ListView의 필터 URL 동기화와 동일한 패턴.
// 모든 전환(다음/이전/처음부터)이 항상 push만 사용 → 뒤로가기 한 번 = 직전에 보였던 화면으로 복귀.
export function pushWizardUrl(query: string) {
  window.history.pushState(null, '', `${window.location.pathname}?${query}`)
}

// 같은 단계에 머문 채 선택값만 바뀔 때(직전 단계 엔트리에 방금 고른 값을 반영할 때,
// 텍스트 입력·카테고리 토글처럼 화면 전환 없이 값만 바뀔 때) 사용 — 새 엔트리를 쌓지 않고
// "현재 엔트리"를 갱신한다. 이걸 거치지 않으면 어떤 단계를 처음 지나칠 때 저장된
// (아직 선택 전) 엔트리가 그대로 남아, 뒤로가기로 그 단계에 돌아왔을 때 선택이
// 안 된 것처럼 보인다.
export function replaceWizardUrl(query: string) {
  window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
}

/**
 * 현재 URL의 경로+쿼리 문자열. 결과 카드의 returnTo(상세 화면에서 "추천 결과로" 눌렀을 때
 * 정확히 지금 이 결과 화면으로 복귀)에 쓰인다. 위저드는 순수 History API로만 URL을 관리하므로
 * (§ pushWizardUrl) 현재 주소를 그대로 읽으면 된다. 항상 클라이언트 상호작용 이후에만 호출되므로
 * SSR에서는 도달하지 않지만, 방어적으로 undefined를 반환한다.
 */
export function currentWizardUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return `${window.location.pathname}${window.location.search}`
}
