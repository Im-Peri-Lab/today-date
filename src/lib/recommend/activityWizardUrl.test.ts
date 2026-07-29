import { describe, it, expect } from 'vitest'
import {
  parseDurationParam,
  parseTimeOfDayParam,
  parseLocationTypeParam,
  readActivityWizardUrlState,
  buildActivityWizardQuery,
  activityConditionsKey,
} from './activityWizardUrl'

describe('readActivityWizardUrlState', () => {
  it('정상 쿼리를 상태로 파싱한다', () => {
    const state = readActivityWizardUrlState(
      '?step=3&duration=full&time=night&loc=indoor&cats=a,b'
    )
    expect(state).toEqual({
      step: 3,
      duration: 'full',
      timeOfDay: 'night',
      locationType: 'indoor',
      categoryIds: ['a', 'b'],
    })
  })

  it('step=result를 결과 화면 단계로 파싱한다', () => {
    expect(readActivityWizardUrlState('?step=result&duration=half').step).toBe('result')
  })

  it('step 파라미터가 없으면 1단계로 기본 처리한다', () => {
    expect(readActivityWizardUrlState('').step).toBe(1)
  })

  it('허용되지 않는 step 값은 1단계로 안전하게 기본 처리한다', () => {
    expect(readActivityWizardUrlState('?step=99').step).toBe(1)
    expect(readActivityWizardUrlState('?step=abc').step).toBe(1)
  })

  it('허용되지 않는 duration/time/location enum 값은 null로 기본 처리한다', () => {
    const state = readActivityWizardUrlState('?duration=bogus&time=bogus&loc=bogus')
    expect(state.duration).toBeNull()
    expect(state.timeOfDay).toBeNull()
    expect(state.locationType).toBeNull()
  })

  it('선택값이 없는 파라미터는 null/빈 배열로 처리한다', () => {
    const state = readActivityWizardUrlState('?step=1')
    expect(state.duration).toBeNull()
    expect(state.timeOfDay).toBeNull()
    expect(state.locationType).toBeNull()
    expect(state.categoryIds).toEqual([])
  })
})

describe('parseDurationParam / parseTimeOfDayParam / parseLocationTypeParam', () => {
  it('유효한 enum 값만 통과시킨다', () => {
    expect(parseDurationParam('half')).toBe('half')
    expect(parseDurationParam('full')).toBe('full')
    expect(parseDurationParam('overnight')).toBe('overnight')
    expect(parseDurationParam('nope')).toBeNull()
    expect(parseDurationParam(null)).toBeNull()

    expect(parseTimeOfDayParam('day')).toBe('day')
    expect(parseTimeOfDayParam('night')).toBe('night')
    expect(parseTimeOfDayParam('any')).toBe('any')
    expect(parseTimeOfDayParam('nope')).toBeNull()

    expect(parseLocationTypeParam('indoor')).toBe('indoor')
    expect(parseLocationTypeParam('outdoor')).toBe('outdoor')
    expect(parseLocationTypeParam('nope')).toBeNull()
  })
})

describe('buildActivityWizardQuery', () => {
  it('선택된 값만 쿼리에 포함한다', () => {
    const qs = buildActivityWizardQuery({
      step: 4,
      duration: 'full',
      timeOfDay: 'day',
      locationType: null,
      categoryIds: [],
    })
    const params = new URLSearchParams(qs)
    expect(params.get('step')).toBe('4')
    expect(params.get('duration')).toBe('full')
    expect(params.get('time')).toBe('day')
    expect(params.has('loc')).toBe(false)
    expect(params.has('cats')).toBe(false)
  })

  it('categoryIds는 쉼표로 join해서 담는다', () => {
    const qs = buildActivityWizardQuery({
      step: 'result',
      duration: 'half',
      timeOfDay: null,
      locationType: null,
      categoryIds: ['x', 'y'],
    })
    expect(new URLSearchParams(qs).get('cats')).toBe('x,y')
  })

  it('파싱→직렬화 왕복이 원래 상태를 보존한다', () => {
    const original = readActivityWizardUrlState('?step=result&duration=overnight&loc=outdoor&cats=p,q')
    const roundTripped = readActivityWizardUrlState(`?${buildActivityWizardQuery(original)}`)
    expect(roundTripped).toEqual(original)
  })
})

describe('activityConditionsKey', () => {
  it('step과 무관하게 조건이 같으면 동일한 키를 만든다', () => {
    const conditions = {
      duration: 'full' as const,
      timeOfDay: 'day' as const,
      locationType: null,
      categoryIds: ['a'],
    }
    const keyFromStep4 = activityConditionsKey(conditions)
    const keyFromResult = activityConditionsKey(conditions)
    expect(keyFromStep4).toBe(keyFromResult)
    expect(keyFromStep4).toContain('step=result')
  })

  it('조건이 다르면 다른 키를 만든다', () => {
    const a = activityConditionsKey({
      duration: 'full',
      timeOfDay: 'day',
      locationType: null,
      categoryIds: [],
    })
    const b = activityConditionsKey({
      duration: 'full',
      timeOfDay: 'night',
      locationType: null,
      categoryIds: [],
    })
    expect(a).not.toBe(b)
  })
})
