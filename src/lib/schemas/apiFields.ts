import { z } from 'zod'
import { isValidReferenceUrl } from '@/lib/url'

/**
 * 활동/다이닝 API(create·patch)가 공통으로 쓰는 필드 스키마 — 두 라우트(`/api/activities`,
 * `/api/places`)의 본문 검증이 거의 동일하게 중복돼 있던 것을 여기 한 곳으로 모았다.
 * create 스키마는 필요한 필드에 `.optional()`을 추가로 씌워 patch(부분 수정)에 재사용한다.
 */

export const apiTitleSchema = z
  .string()
  .min(1, '제목을 입력해 주세요.')
  .max(100, '제목은 100자 이하로 입력해 주세요.')

export const apiCategoryIdSchema = z.string().uuid().optional().nullable()

export const apiLocationSchema = z
  .string()
  .max(200, '위치는 200자 이하로 입력해 주세요.')
  .optional()
  .nullable()

export const apiMemoSchema = z
  .string()
  .max(1000, '메모는 1000자 이하로 입력해 주세요.')
  .optional()
  .nullable()

export const apiReferenceUrlSchema = z
  .string()
  .refine(isValidReferenceUrl, '올바른 URL 형식이 아닙니다.')
  .optional()
  .nullable()
  .or(z.literal(''))

// patch 전용 — 활동/다이닝 상세 화면의 상태·방문·평점 편집이 공통으로 쓰는 필드(둘 다 동일).
export const apiStatusSchema = z.enum(['wishlist', 'visited', 'archived']).optional()
export const apiVisitedAtSchema = z.string().optional().nullable()
export const apiRatingSchema = z.number().int().min(1).max(5).optional().nullable()
export const apiReviewNoteSchema = z.string().optional().nullable()

/**
 * 목록 GET 쿼리 파라미터 공통 베이스 — status/category_id/q는 활동·다이닝 두 라우트가 동일하게
 * 받는다. 활동은 duration_bucket/time_of_day/location_type, 다이닝은 area/meal_time을 각자
 * `.extend()`로 덧붙인다(§ activities/route.ts, places/route.ts).
 */
export const apiListQueryBase = {
  status: apiStatusSchema.default('wishlist'),
  category_id: z.string().optional(),
  q: z.string().optional(),
}

/** `category_id` 쿼리는 쉼표로 조인된 id 목록(예: "a,b,c") — 두 목록 GET 라우트가 동일하게 분해한다. */
export function splitCommaIds(v: string | undefined): string[] {
  return v ? v.split(',').filter(Boolean) : []
}

/**
 * 폼(react-hook-form)의 선택 텍스트 필드는 항상 문자열("" 포함)이지만 API는 "값 없음"을
 * null로 받는다 — 빈 문자열 → null 정규화 기준을 한 곳에 고정해 폼마다 따로 정의하지 않게 한다.
 */
export function emptyToNull(v: string | undefined): string | null {
  return v ? v : null
}
