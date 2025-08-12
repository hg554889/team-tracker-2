import { z } from 'zod';

export const reportCreateSchema = z.object({
  body: z.object({
    teamId: z.string().min(1),
    weekOf: z.string().datetime(),
    progress: z.number().min(0).max(100),
    goals: z.string().default(''),
    issues: z.string().default(''),
    dueAt: z.string().datetime().optional(),
    attachments: z.array(z.object({
      url: z.string().url(),
      name: z.string().optional(),
      size: z.number().optional(),
      type: z.string().optional()
    })).optional()
  })
});

// ✅ 코멘트 검증 추가
export const commentCreateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    text: z.string().min(1).max(2000)
  })
});