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

/**
 * 표시용 닉네임(016) — trim 후 빈 문자열은 "미설정"(null)으로 정규화한다.
 * null 입력(명시적으로 닉네임을 지움)은 trim/길이 검사를 건너뛰고 그대로 통과한다.
 */
export const apiNicknameSchema = z
  .string()
  .trim()
  .max(20, '닉네임은 20자 이하로 입력해 주세요.')
  .nullable()
  .transform((v) => (v ? v : null))

export const apiReferenceUrlSchema = z
  .string()
  .refine(isValidReferenceUrl, '올바른 URL 형식이 아닙니다.')
  .optional()
  .nullable()
  .or(z.literal(''))

// patch 전용 — 활동/다이닝 상세 화면의 상태·방문·평점 편집이 공통으로 쓰는 필드(둘 다 동일).
export const apiStatusSchema = z.enum(['wishlist', 'visited', 'archived']).optional()
export const apiVisitedAtSchema = z.string().optional().nullable()
/**
 * 방문 예정일(020) — 'YYYY-MM-DD' 또는 null(지움). 빈 문자열은 null 로 정규화한다.
 * create·patch 가 같은 스키마를 쓴다(미지정=변경 없음, null=삭제).
 */
export const apiPlannedAtSchema = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다.'), z.literal('')])
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v))

/**
 * 방문 예정 시작 시간(021) — 'HH:mm' 또는 null(지움 = 종일). 'HH:mm:ss' 는 받되 'HH:mm' 으로 정규화하고,
 * 빈 문자열은 null. 시(2자리 00~23)·분(2자리 00~59)만 허용 — '24:00'·'9:00'·'19:7' 은 거부.
 * 미지정(undefined)=변경 없음, null=지우기. 날짜와의 짝 규칙은 `applyPlannedTimeRule` 이 맡는다.
 */
export const apiPlannedTimeSchema = z
  .union([
    z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, '올바른 시간 형식이 아닙니다.'),
    z.literal(''),
  ])
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : typeof v === 'string' ? v.slice(0, 5) : v))

/**
 * 방문 예정일·시간 짝 규칙(021) — 같은 요청 안에서만 판정한다(PATCH 는 DB 값을 보지 않는다).
 * 1. planned_time 키가 없으면(undefined) 건드리지 않는다.
 * 2. planned_at: null(날짜 지우기)이면 planned_time 도 null 로 강제한다.
 * 3. planned_time 이 값인데 같은 요청의 planned_at 이 없거나 null 이면 거부(400).
 * DB CHECK(planned_time is null or planned_at is not null)가 마지막 방어선이다.
 */
export function applyPlannedTimeRule<
  T extends { planned_at?: string | null; planned_time?: string | null },
>(data: T): { ok: true; data: T } | { ok: false; error: string } {
  // 3번을 먼저 본다 — { planned_at: null, planned_time: '19:00' } 처럼 모순된 요청은 조용히 고치지 않고 거부.
  if (data.planned_time != null && !data.planned_at) {
    return { ok: false, error: '방문 예정 시간은 방문 예정일과 함께 보내야 해요.' }
  }
  if (data.planned_at === null) return { ok: true, data: { ...data, planned_time: null } }
  return { ok: true, data }
}

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
  // 위시리스트 "방문예정만" 필터(020) — 'true' 일 때만 켜진다. 다녀온 곳에서는 무시된다.
  planned_only: z.enum(['true']).optional(),
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
