import { describe, it, expect, beforeEach } from 'vitest'
import {
  stashActivityResult,
  readActivityResult,
  stashPlaceResult,
  readPlaceResult,
} from './resultCache'
import type { ActivityRecommendResponse, PlaceRecommendResponse } from '@/hooks/useRecommend'

const ACTIVITY_KEY = 'today-date:recommend-result:activity'
const PLACE_KEY = 'today-date:recommend-result:place'

const activityData = {
  recommendations: [],
  reason: '테스트 이유',
  poolSize: 5,
  log_id: 'log-1',
} as unknown as ActivityRecommendResponse

const placeData = {
  recommendations: [],
  reason: '테스트 이유',
  poolSize: 5,
  log_id: 'log-2',
} as unknown as PlaceRecommendResponse

beforeEach(() => {
  sessionStorage.clear()
})

describe('activity 결과 캐시', () => {
  it('conditionsKey가 일치하면 저장된 결과를 복원한다', () => {
    stashActivityResult('cond-a', true, activityData)
    const restored = readActivityResult('cond-a')
    expect(restored).toEqual({ includeShorter: true, data: activityData })
  })

  it('conditionsKey가 다르면 캐시를 사용하지 않는다', () => {
    stashActivityResult('cond-a', false, activityData)
    expect(readActivityResult('cond-b')).toBeNull()
  })

  it('저장된 값이 없으면 null을 반환한다', () => {
    expect(readActivityResult('cond-never-stashed')).toBeNull()
  })

  it('손상된 sessionStorage JSON은 예외 없이 null을 반환한다', () => {
    sessionStorage.setItem(ACTIVITY_KEY, '{not valid json')
    expect(() => readActivityResult('cond-a')).not.toThrow()
    expect(readActivityResult('cond-a')).toBeNull()
  })
})

describe('place 결과 캐시', () => {
  it('conditionsKey가 일치하면 저장된 결과를 복원한다', () => {
    stashPlaceResult('cond-p', placeData)
    expect(readPlaceResult('cond-p')).toEqual(placeData)
  })

  it('conditionsKey가 다르면 캐시를 사용하지 않는다', () => {
    stashPlaceResult('cond-p', placeData)
    expect(readPlaceResult('cond-q')).toBeNull()
  })

  it('손상된 sessionStorage JSON은 예외 없이 null을 반환한다', () => {
    sessionStorage.setItem(PLACE_KEY, '{not valid json')
    expect(() => readPlaceResult('cond-p')).not.toThrow()
    expect(readPlaceResult('cond-p')).toBeNull()
  })
})
