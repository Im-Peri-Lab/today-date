import { z } from 'zod'
import { isValidReferenceUrl } from '@/lib/url'

export const activityFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하로 입력해 주세요.'),
  category_id: z.string().optional(),
  duration_bucket: z.enum(['half', 'full', 'overnight'], {
    error: '소요시간을 선택해 주세요.',
  }),
  time_of_day: z.enum(['day', 'night', 'any'], {
    error: '시간대를 선택해 주세요.',
  }),
  location: z.string().max(200, '위치는 200자 이하로 입력해 주세요.').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해 주세요.').optional(),
  reference_url: z
    .string()
    .optional()
    .refine((v) => isValidReferenceUrl(v ?? ''), {
      message: '올바른 URL 형식이 아닙니다.',
    }),
})

export type ActivityFormValues = z.infer<typeof activityFormSchema>
