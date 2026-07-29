import { describe, it, expect } from 'vitest'
import {
  apiTitleSchema,
  apiCategoryIdSchema,
  apiLocationSchema,
  apiMemoSchema,
  apiReferenceUrlSchema,
  apiListQueryBase,
  splitCommaIds,
  emptyToNull,
} from './apiFields'
import { z } from 'zod'

describe('apiTitleSchema', () => {
  it('빈 문자열을 거부한다', () => {
    expect(apiTitleSchema.safeParse('').success).toBe(false)
  })

  it('100자를 초과하면 거부한다', () => {
    expect(apiTitleSchema.safeParse('a'.repeat(101)).success).toBe(false)
  })

  it('1~100자 문자열은 통과한다', () => {
    expect(apiTitleSchema.safeParse('한강 자전거').success).toBe(true)
  })
})

describe('apiCategoryIdSchema', () => {
  it('UUID가 아니면 거부한다', () => {
    expect(apiCategoryIdSchema.safeParse('not-a-uuid').success).toBe(false)
  })

  it('null과 undefined는 허용한다(선택 필드)', () => {
    expect(apiCategoryIdSchema.safeParse(null).success).toBe(true)
    expect(apiCategoryIdSchema.safeParse(undefined).success).toBe(true)
  })

  it('유효한 UUID는 통과한다', () => {
    expect(apiCategoryIdSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(
      true
    )
  })
})

describe('apiLocationSchema / apiMemoSchema', () => {
  it('길이 제한을 초과하면 거부한다', () => {
    expect(apiLocationSchema.safeParse('a'.repeat(201)).success).toBe(false)
    expect(apiMemoSchema.safeParse('a'.repeat(1001)).success).toBe(false)
  })

  it('null·undefined·빈 문자열 모두 허용한다', () => {
    expect(apiLocationSchema.safeParse(null).success).toBe(true)
    expect(apiLocationSchema.safeParse(undefined).success).toBe(true)
    expect(apiLocationSchema.safeParse('').success).toBe(true)
  })
})

describe('apiReferenceUrlSchema', () => {
  it('빈 문자열·null·undefined를 모두 허용한다(선택 항목)', () => {
    expect(apiReferenceUrlSchema.safeParse('').success).toBe(true)
    expect(apiReferenceUrlSchema.safeParse(null).success).toBe(true)
    expect(apiReferenceUrlSchema.safeParse(undefined).success).toBe(true)
  })

  it('스킴 없는 도메인은 https:// 보정 후 유효하면 통과한다', () => {
    expect(apiReferenceUrlSchema.safeParse('naver.com').success).toBe(true)
  })

  it('URL로 해석되지 않는 값은 거부한다', () => {
    expect(apiReferenceUrlSchema.safeParse('   ::not a url::').success).toBe(false)
  })
})

describe('apiListQueryBase', () => {
  const schema = z.object(apiListQueryBase)

  it('status 생략 시 wishlist로 기본값이 채워진다', () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('wishlist')
  })

  it('유효하지 않은 status는 거부한다', () => {
    expect(schema.safeParse({ status: 'bogus' }).success).toBe(false)
  })
})

describe('splitCommaIds', () => {
  it('쉼표로 구분된 id 목록을 배열로 분해한다', () => {
    expect(splitCommaIds('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('빈 문자열이 섞여 있으면 걸러낸다', () => {
    expect(splitCommaIds('a,,b,')).toEqual(['a', 'b'])
  })

  it('undefined면 빈 배열을 반환한다', () => {
    expect(splitCommaIds(undefined)).toEqual([])
  })
})

describe('emptyToNull', () => {
  it('빈 문자열·undefined는 null로 정규화한다', () => {
    expect(emptyToNull('')).toBeNull()
    expect(emptyToNull(undefined)).toBeNull()
  })

  it('값이 있으면 그대로 반환한다', () => {
    expect(emptyToNull('망원동')).toBe('망원동')
  })
})
