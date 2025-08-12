import { z } from 'zod';

export const teamCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(['STUDY','PROJECT']),
    description: z.string().optional(),
    clubId: z.string().min(1),
    goal: z.string().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional()
  })
});

export const teamMemberSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ userId: z.string().min(1), role: z.enum(['LEADER','MEMBER']).optional() })
});