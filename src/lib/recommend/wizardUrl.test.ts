import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseCategoryIdsParam,
  pushWizardUrl,
  replaceWizardUrl,
  currentWizardUrl,
} from './wizardUrl'

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

describe('pushWizardUrl / replaceWizardUrl / currentWizardUrl', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/recommend/activity')
  })

  it('pushWizardUrl은 현재 pathname에 쿼리를 붙여 새 히스토리 엔트리를 쌓는다', () => {
    const before = window.history.length
    pushWizardUrl('step=2&duration=half')
    expect(window.location.pathname + window.location.search).toBe(
      '/recommend/activity?step=2&duration=half'
    )
    expect(window.history.length).toBe(before + 1)
  })

  it('replaceWizardUrl은 새 엔트리를 쌓지 않고 현재 엔트리만 갱신한다', () => {
    pushWizardUrl('step=1')
    const before = window.history.length
    replaceWizardUrl('step=1&duration=half')
    expect(window.location.pathname + window.location.search).toBe(
      '/recommend/activity?step=1&duration=half'
    )
    expect(window.history.length).toBe(before)
  })

  it('currentWizardUrl은 현재 pathname+search를 그대로 반환한다', () => {
    pushWizardUrl('step=result&duration=half')
    expect(currentWizardUrl()).toBe('/recommend/activity?step=result&duration=half')
  })
})
