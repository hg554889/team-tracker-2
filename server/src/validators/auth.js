import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(2).max(30),
    password: z.string().min(8),
    studentId: z.string().min(1).max(20), // 문자열로 변경, 학번 형식 다양함
    clubId: z.string().min(1)
  })
});

export const updateUserInfoSchema = z.object({
  body: z.object({
    username: z.string().min(2).max(30).optional(),
    studentId: z.string().min(1).max(20).optional() // 문자열로 변경
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});