import { describe, it, expect } from 'vitest'
import {
  getAfterSaveReturnTo,
  getSafeListReturnTo,
  getSafeNewReturnTo,
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

  it('허용 목록에 없는 경로는 차단한다', () => {
    expect(getSafeListReturnTo('/activities/123')).toBeUndefined()
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

describe('getSafeNewReturnTo / getAfterSaveReturnTo', () => {
  it('목록·추천 결과는 기존 검증과 동일하게 통과한다', () => {
    expect(getSafeNewReturnTo('/list?tab=place')).toBe('/list?tab=place')
    expect(getSafeNewReturnTo('/recommend/place?step=result')).toBe('/recommend/place?step=result')
  })

  it('상세 경로를 허용하고, 그 상세의 returnTo는 안전한 값만 남긴다', () => {
    expect(getSafeNewReturnTo('/activities/abc?returnTo=%2Flist%3Ftab%3Dactivity')).toBe(
      '/activities/abc?returnTo=%2Flist%3Ftab%3Dactivity'
    )
    expect(getSafeNewReturnTo('/places/abc?edit=info&returnTo=https%3A%2F%2Fevil.com')).toBe(
      '/places/abc'
    )
  })

  it('상세가 아닌 경로·외부 오리진은 차단한다', () => {
    expect(getSafeNewReturnTo('/account')).toBeUndefined()
    expect(getSafeNewReturnTo('/activities/a/b')).toBeUndefined()
    expect(getSafeNewReturnTo('//evil.example.com/activities/1')).toBeUndefined()
    expect(getSafeListReturnTo('/activities/abc')).toBeUndefined()
  })

  it('저장 후 상세의 returnTo는 출발 상세의 returnTo를 이어받는다', () => {
    expect(getAfterSaveReturnTo('/activities/abc?returnTo=%2Flist%3Ftab%3Dactivity')).toBe(
      '/list?tab=activity'
    )
    expect(getAfterSaveReturnTo('/places/abc')).toBeUndefined()
    expect(getAfterSaveReturnTo('/list?tab=place')).toBe('/list?tab=place')
    expect(getAfterSaveReturnTo(undefined)).toBeUndefined()
  })
})
