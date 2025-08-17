import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(2).max(30),
    password: z.string().min(8),
    studentId: z.number().int().positive()
  })
});

export const updateUserInfoSchema = z.object({
  body: z.object({
    username: z.string().min(2).max(30).optional(),
    studentId: z.number().int().positive().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});