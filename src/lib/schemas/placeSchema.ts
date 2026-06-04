import { z } from 'zod'

export const placeFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하로 입력해 주세요.'),
  category_id: z.string().optional(),
  location: z.string().min(1, '위치를 입력해 주세요.'),
  meal_times: z
    .array(z.enum(['lunch', 'dinner']))
    .min(1, '식사 시간을 하나 이상 선택해 주세요.')
    .max(2),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해 주세요.').optional(),
  reference_url: z
    .string()
    .optional()
    .refine((v) => !v || v === '' || /^https?:\/\/.+/.test(v), {
      message: '올바른 URL 형식이 아닙니다. (http:// 또는 https://로 시작)',
    }),
  added_by: z.string().optional(),
})

export type PlaceFormValues = z.infer<typeof placeFormSchema>
