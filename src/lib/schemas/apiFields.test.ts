import { describe, it, expect } from 'vitest'
import {
  apiTitleSchema,
  apiCategoryIdSchema,
  apiLocationSchema,
  apiMemoSchema,
  apiNicknameSchema,
  apiReferenceUrlSchema,
  apiPlannedAtSchema,
  apiPlannedTimeSchema,
  applyPlannedTimeRule,
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

describe('apiNicknameSchema', () => {
  it('20자를 초과하면 거부한다', () => {
    expect(apiNicknameSchema.safeParse('a'.repeat(21)).success).toBe(false)
  })

  it('20자는 통과한다', () => {
    expect(apiNicknameSchema.safeParse('a'.repeat(20)).success).toBe(true)
  })

  it('앞뒤 공백을 trim한다', () => {
    const result = apiNicknameSchema.safeParse('  민지  ')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('민지')
  })

  it('빈 문자열·공백만 입력하면 null(미설정)로 정규화한다', () => {
    const empty = apiNicknameSchema.safeParse('')
    expect(empty.success).toBe(true)
    if (empty.success) expect(empty.data).toBeNull()

    const spaceOnly = apiNicknameSchema.safeParse('   ')
    expect(spaceOnly.success).toBe(true)
    if (spaceOnly.success) expect(spaceOnly.data).toBeNull()
  })

  it('null을 그대로 허용한다(명시적 미설정)', () => {
    const result = apiNicknameSchema.safeParse(null)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBeNull()
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

describe('apiPlannedAtSchema', () => {
  it('YYYY-MM-DD 는 통과, 빈 문자열은 null 로 정규화한다', () => {
    expect(apiPlannedAtSchema.parse('2026-07-09')).toBe('2026-07-09')
    expect(apiPlannedAtSchema.parse('')).toBeNull()
    expect(apiPlannedAtSchema.parse(null)).toBeNull()
  })

  it('미지정은 undefined(변경 없음)로 유지한다', () => {
    expect(apiPlannedAtSchema.parse(undefined)).toBeUndefined()
  })

  it('날짜 형식이 아니면 거부한다', () => {
    expect(apiPlannedAtSchema.safeParse('26.07.09').success).toBe(false)
    expect(apiPlannedAtSchema.safeParse('2026-07-09T00:00:00Z').success).toBe(false)
  })
})

describe('apiPlannedTimeSchema', () => {
  it('HH:mm 을 받고 HH:mm:ss 는 HH:mm 으로 정규화한다', () => {
    expect(apiPlannedTimeSchema.parse('19:00')).toBe('19:00')
    expect(apiPlannedTimeSchema.parse('00:00')).toBe('00:00')
    expect(apiPlannedTimeSchema.parse('23:59')).toBe('23:59')
    expect(apiPlannedTimeSchema.parse('19:00:00')).toBe('19:00')
  })

  it('빈 문자열은 null, null·undefined 는 그대로', () => {
    expect(apiPlannedTimeSchema.parse('')).toBeNull()
    expect(apiPlannedTimeSchema.parse(null)).toBeNull()
    expect(apiPlannedTimeSchema.parse(undefined)).toBeUndefined()
  })

  it('24:00 · 9:00 · 19:7 · 19:60 은 거부한다', () => {
    for (const v of ['24:00', '9:00', '19:7', '19:60', '7pm']) {
      expect(apiPlannedTimeSchema.safeParse(v).success).toBe(false)
    }
  })
})

describe('applyPlannedTimeRule', () => {
  it('planned_time 키가 없으면 건드리지 않는다(undefined = 변경 없음)', () => {
    const r = applyPlannedTimeRule({ planned_at: '2026-12-19' })
    expect(r).toEqual({ ok: true, data: { planned_at: '2026-12-19' } })
    expect(r.ok && 'planned_time' in r.data).toBe(false)

    const other = applyPlannedTimeRule({ title: 'x' } as { title: string; planned_at?: string | null })
    expect(other.ok && 'planned_time' in other.data).toBe(false)
  })

  it('planned_at: null 이면 planned_time 도 null 로 강제한다', () => {
    expect(applyPlannedTimeRule({ planned_at: null })).toEqual({
      ok: true,
      data: { planned_at: null, planned_time: null },
    })
    expect(applyPlannedTimeRule({ planned_at: null, planned_time: null })).toEqual({
      ok: true,
      data: { planned_at: null, planned_time: null },
    })
  })

  it('시간이 값인데 같은 요청에 날짜가 없거나 null 이면 거부한다', () => {
    expect(applyPlannedTimeRule({ planned_time: '19:00' }).ok).toBe(false)
    expect(applyPlannedTimeRule({ planned_at: null, planned_time: '19:00' }).ok).toBe(false)
  })

  it('날짜와 함께 오면 통과, 시간 null(종일로)도 통과', () => {
    expect(applyPlannedTimeRule({ planned_at: '2026-12-19', planned_time: '19:00' }).ok).toBe(true)
    expect(applyPlannedTimeRule({ planned_time: null }).ok).toBe(true)
  })
})
