import { describe, it, expect } from 'vitest'
import {
  getReturnLabel,
  getSafeListReturnTo,
  isRecommendReturnTo,
  RECOMMEND_RETURN_PATHS,
} from './listReturn'

describe('getSafeListReturnTo', () => {
  it('목록 화면 경로를 허용한다', () => {
    expect(getSafeListReturnTo('/list?tab=activity&status=wishlist')).toBe(
      '/list?tab=activity&status=wishlist'
    )
  })

  it('추천위저드 결과 화면 경로를 허용한다', () => {
    for (const path of RECOMMEND_RETURN_PATHS) {
      expect(getSafeListReturnTo(`${path}?step=result&duration=full`)).toBe(
        `${path}?step=result&duration=full`
      )
    }
  })

  it('홈 경로를 허용한다', () => {
    expect(getSafeListReturnTo('/')).toBe('/')
  })

  it('상세 경로를 허용하고, 그 상세의 returnTo는 재귀 검증해 안전한 값만 남긴다', () => {
    expect(getSafeListReturnTo('/activities/abc?returnTo=%2Flist%3Ftab%3Dactivity')).toBe(
      '/activities/abc?returnTo=%2Flist%3Ftab%3Dactivity'
    )
    expect(getSafeListReturnTo('/places/abc?edit=info&returnTo=https%3A%2F%2Fevil.com')).toBe(
      '/places/abc'
    )
    expect(
      getSafeListReturnTo('/places/b?returnTo=%2Fplaces%2Fa%3FreturnTo%3D%252F')
    ).toBe('/places/b?returnTo=%2Fplaces%2Fa%3FreturnTo%3D%252F')
  })

  it('허용 목록에 없는 경로는 차단한다', () => {
    expect(getSafeListReturnTo('/account')).toBeUndefined()
    expect(getSafeListReturnTo('/activities/a/b')).toBeUndefined()
  })

  it('절대 URL(외부 오리진)은 차단한다', () => {
    expect(getSafeListReturnTo('https://evil.example.com/list')).toBeUndefined()
  })

  it('프로토콜 상대 URL로 오리진을 바꾸려는 시도를 차단한다', () => {
    expect(getSafeListReturnTo('//evil.example.com/list')).toBeUndefined()
  })

  it('빈 값이나 슬래시로 시작하지 않는 값은 차단한다', () => {
    expect(getSafeListReturnTo(null)).toBeUndefined()
    expect(getSafeListReturnTo(undefined)).toBeUndefined()
    expect(getSafeListReturnTo('')).toBeUndefined()
    expect(getSafeListReturnTo('list')).toBeUndefined()
  })

  it('배열로 전달되면 첫 값만 검사한다', () => {
    expect(getSafeListReturnTo(['/list', '/other'])).toBe('/list')
  })
})

describe('isRecommendReturnTo', () => {
  it('추천위저드 결과 경로면 true를 반환한다', () => {
    expect(isRecommendReturnTo('/recommend/activity?step=result')).toBe(true)
    expect(isRecommendReturnTo('/recommend/place')).toBe(true)
  })

  it('목록 화면이나 값 없음이면 false를 반환한다', () => {
    expect(isRecommendReturnTo('/list?tab=activity')).toBe(false)
    expect(isRecommendReturnTo(undefined)).toBe(false)
  })
})

describe('getReturnLabel', () => {
  it('returnTo 종류별 라벨, 없으면 fallback', () => {
    expect(getReturnLabel(undefined, '홈으로')).toBe('홈으로')
    expect(getReturnLabel(undefined, '목록으로')).toBe('목록으로')
    expect(getReturnLabel('/', '목록으로')).toBe('홈으로')
    expect(getReturnLabel('/list?tab=place', '홈으로')).toBe('목록으로')
    expect(getReturnLabel('/recommend/place?step=result', '홈으로')).toBe('추천 결과로')
    expect(getReturnLabel('/activities/abc?returnTo=%2F', '홈으로')).toBe('상세로')
  })
})
