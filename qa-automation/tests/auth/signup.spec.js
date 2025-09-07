import { test, expect } from '@playwright/test';
import { signupUser } from '../../utils/authHelpers.js';
import { testData } from '../../fixtures/testUsers.js';

test.describe('회원가입 기능', () => {
  test('유효한 정보로 회원가입 성공', async ({ page }) => {
    const newUser = {
      name: 'QA Test User',
      email: `qa-test-${Date.now()}@test.com`,
      password: 'TestPassword123!'
    };
    
    await page.goto('/signup');
    
    // 회원가입 폼 존재 확인
    await expect(page.locator('[name="name"]')).toBeVisible();
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // 회원가입 정보 입력
    await page.fill('[name="name"]', newUser.name);
    await page.fill('[name="email"]', newUser.email);
    await page.fill('[name="password"]', newUser.password);
    await page.click('button[type="submit"]');
    
    // 클럽 선택 페이지로 이동 확인
    await page.waitForURL('/select-club');
    
    // 클럽 선택 옵션이 보이는지 확인
    await expect(page.locator('text=클럽 선택')).toBeVisible();
  });

  test('중복 이메일로 회원가입 실패', async ({ page }) => {
    const duplicateUser = {
      name: 'Duplicate User',
      email: 'qa-member@test.com', // 이미 존재하는 이메일
      password: 'TestPassword123!'
    };
    
    await page.goto('/signup');
    
    await page.fill('[name="name"]', duplicateUser.name);
    await page.fill('[name="email"]', duplicateUser.email);
    await page.fill('[name="password"]', duplicateUser.password);
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('.error, [data-testid="error"]')).toBeVisible();
    
    // 회원가입 페이지에 머물러 있는지 확인
    expect(page.url()).toContain('/signup');
  });

  test('잘못된 이메일 형식으로 회원가입 실패', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // HTML5 validation 또는 에러 메시지 확인
    const emailField = page.locator('[name="email"]');
    const validityState = await emailField.evaluate(el => el.validity.valid);
    expect(validityState).toBe(false);
  });

  test('약한 비밀번호로 회원가입 실패', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', `test-${Date.now()}@test.com`);
    await page.fill('[name="password"]', '123'); // 약한 비밀번호
    await page.click('button[type="submit"]');
    
    // 비밀번호 validation 에러 확인
    await expect(page.locator('.error, [data-testid="error"]')).toBeVisible();
  });

  test('필수 필드 누락으로 회원가입 실패', async ({ page }) => {
    await page.goto('/signup');
    
    // 이름만 입력하고 제출
    await page.fill('[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // HTML5 validation 확인
    const emailField = page.locator('[name="email"]');
    const passwordField = page.locator('[name="password"]');
    
    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('클럽 선택 완료 후 승인 대기 상태', async ({ page }) => {
    const newUser = {
      name: 'QA Club Test User',
      email: `qa-club-test-${Date.now()}@test.com`,
      password: 'TestPassword123!'
    };
    
    await signupUser(page, newUser);
    
    // 클럽 선택 페이지에서 클럽 선택
    await page.waitForURL('/select-club');
    await page.click(`text=${testData.club.name}`);
    
    // 승인 대기 페이지로 이동 확인
    await page.waitForURL('/approval-pending');
    
    // 승인 대기 메시지 확인
    await expect(page.locator('text=승인 대기')).toBeVisible();
  });

  test('로그인 페이지로 이동 링크 확인', async ({ page }) => {
    await page.goto('/signup');
    
    // 로그인 페이지 링크 클릭
    await page.click('text=이미 계정이 있으신가요?');
    
    // 로그인 페이지로 이동 확인
    await page.waitForURL('/login');
  });
});