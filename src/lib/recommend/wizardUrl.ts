/** 활동/다이닝 위저드가 공통으로 쓰는 카테고리 id 쿼리 파서 (예: "a,b,c" → ["a","b","c"]). */
export function parseCategoryIdsParam(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : []
}
