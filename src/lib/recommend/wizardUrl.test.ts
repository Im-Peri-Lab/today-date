import { describe, it, expect } from 'vitest'
import { parseCategoryIdsParam } from './wizardUrl'

describe('parseCategoryIdsParam', () => {
  it('쉼표로 구분된 id 목록을 배열로 파싱한다', () => {
    expect(parseCategoryIdsParam('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('빈 문자열이 섞여 있으면 걸러낸다', () => {
    expect(parseCategoryIdsParam('a,,b,')).toEqual(['a', 'b'])
  })

  it('null이면 빈 배열을 반환한다', () => {
    expect(parseCategoryIdsParam(null)).toEqual([])
  })

  it('빈 문자열이면 빈 배열을 반환한다', () => {
    expect(parseCategoryIdsParam('')).toEqual([])
  })
})
