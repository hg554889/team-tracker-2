import { z } from "zod";

// 회원가입 유효성 검사
export const signupSchema = z.object({
  body: z.object({
    // 공백 허용으로 인한 오탐 방지를 위해 trim 처리, 이메일은 소문자화
    email: z.string().trim().email().toLowerCase(),
    username: z.string().trim().min(2).max(30),
    // 비밀번호는 공백 자체를 허용할 수 있으므로 trim하지 않음
    password: z.string().min(8),
    // 학번은 문자열로 받고 공백 제거 후 길이 제한
    studentId: z.string().trim().min(1).max(20),
    // 동아리 ID 선택 값도 공백 제거
    clubId: z.string().trim().min(1),
  }),
});

// 사용자 정보 업데이트 유효성 검사
export const updateUserInfoSchema = z.object({
  body: z.object({
    username: z.string().trim().min(2).max(30).optional(),
    studentId: z.string().trim().min(1).max(20).optional(),
  }),
});

// 로그인 유효성 검사
export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8),
  }),
});
