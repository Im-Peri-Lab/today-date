import { describe, it, expect } from 'vitest'
import {
  parseMealParam,
  readPlaceWizardUrlState,
  buildPlaceWizardQuery,
  placeConditionsKey,
} from './placeWizardUrl'

describe('readPlaceWizardUrlState', () => {
  it('정상 쿼리를 상태로 파싱한다', () => {
    const state = readPlaceWizardUrlState('?step=2&meal=dinner&area=%EB%A7%88%ED%8F%AC&cats=a,b')
    expect(state).toEqual({
      step: 2,
      meal: 'dinner',
      area: '마포',
      categoryIds: ['a', 'b'],
    })
  })

  it('step=result를 결과 화면 단계로 파싱한다', () => {
    expect(readPlaceWizardUrlState('?step=result&meal=lunch').step).toBe('result')
  })

  it('step 파라미터가 없으면 1단계로 기본 처리한다', () => {
    expect(readPlaceWizardUrlState('').step).toBe(1)
  })

  it('허용되지 않는 step 값은 1단계로 안전하게 기본 처리한다', () => {
    expect(readPlaceWizardUrlState('?step=99').step).toBe(1)
    expect(readPlaceWizardUrlState('?step=xyz').step).toBe(1)
  })

  it('허용되지 않는 meal enum 값은 null로 기본 처리한다', () => {
    expect(readPlaceWizardUrlState('?meal=brunch').meal).toBeNull()
  })

  it('area가 없으면 빈 문자열로 처리한다', () => {
    expect(readPlaceWizardUrlState('?step=2').area).toBe('')
  })
})

describe('parseMealParam', () => {
  it('유효한 enum 값만 통과시킨다', () => {
    expect(parseMealParam('lunch')).toBe('lunch')
    expect(parseMealParam('dinner')).toBe('dinner')
    expect(parseMealParam('brunch')).toBeNull()
    expect(parseMealParam(null)).toBeNull()
  })
})

describe('buildPlaceWizardQuery', () => {
  it('선택된 값만 쿼리에 포함한다', () => {
    const qs = buildPlaceWizardQuery({ step: 3, meal: 'lunch', area: '', categoryIds: [] })
    const params = new URLSearchParams(qs)
    expect(params.get('step')).toBe('3')
    expect(params.get('meal')).toBe('lunch')
    expect(params.has('area')).toBe(false)
    expect(params.has('cats')).toBe(false)
  })

  it('파싱→직렬화 왕복이 원래 상태를 보존한다', () => {
    const original = readPlaceWizardUrlState('?step=result&meal=dinner&area=성수동&cats=p,q')
    const roundTripped = readPlaceWizardUrlState(`?${buildPlaceWizardQuery(original)}`)
    expect(roundTripped).toEqual(original)
  })
})

describe('placeConditionsKey', () => {
  it('조건이 같으면 동일한 키, 다르면 다른 키를 만든다', () => {
    const base = { meal: 'lunch' as const, area: '강남', categoryIds: ['a'] }
    expect(placeConditionsKey(base)).toBe(placeConditionsKey({ ...base }))
    expect(placeConditionsKey(base)).not.toBe(placeConditionsKey({ ...base, area: '홍대' }))
  })
})
