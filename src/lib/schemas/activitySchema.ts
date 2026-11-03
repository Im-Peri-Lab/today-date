import { z } from 'zod'
import { isValidReferenceUrl } from '@/lib/url'

export const activityFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하로 입력해 주세요.'),
  category_id: z.string().optional(),
  location_type: z.enum(['indoor', 'outdoor'], {
    error: '실내/실외를 선택해 주세요.',
  }),
  duration_bucket: z.enum(['half', 'full', 'overnight'], {
    error: '소요시간을 선택해 주세요.',
  }),
  time_of_day: z.enum(['day', 'night', 'any'], {
    error: '시간대를 선택해 주세요.',
  }),
  location: z.string().max(200, '위치는 200자 이하로 입력해 주세요.').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해 주세요.').optional(),
  // 방문 예정일(020) — 위시리스트일 때만 폼에 노출. 'YYYY-MM-DD' 또는 빈 문자열.
  planned_at: z.string().optional(),
  // 방문 예정 시작 시간(021) — 'HH:mm' 또는 빈 문자열(종일). 날짜가 있을 때만 입력 가능.
  planned_time: z.string().optional(),
  reference_url: z
    .string()
    .optional()
    .refine((v) => isValidReferenceUrl(v ?? ''), {
      message: '올바른 URL 형식이 아닙니다.',
    }),
})

export type ActivityFormValues = z.infer<typeof activityFormSchema>
