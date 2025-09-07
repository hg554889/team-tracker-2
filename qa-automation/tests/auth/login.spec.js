import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { testUsers } from '../../fixtures/testUsers.js';

test.describe('로그인 기능', () => {
  test('유효한 사용자 로그인 성공', async ({ page }) => {
    const user = testUsers.member;
    
    await page.goto('/login');
    
    // 로그인 폼 존재 확인
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // 로그인 정보 입력
    await page.fill('[name="email"]', user.email);
    await page.fill('[name="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // 대시보드로 리다이렉트 확인
    await page.waitForURL(url => !url.includes('/login'));
    
    // 네비게이션바에 사용자 정보 표시 확인
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('잘못된 이메일로 로그인 실패', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@email.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('.error, [data-testid="error"]')).toBeVisible();
    
    // 로그인 페이지에 머물러 있는지 확인
    expect(page.url()).toContain('/login');
  });

  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    const user = testUsers.member;
    
    await page.goto('/login');
    
    await page.fill('[name="email"]', user.email);
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('.error, [data-testid="error"]')).toBeVisible();
    
    // 로그인 페이지에 머물러 있는지 확인
    expect(page.url()).toContain('/login');
  });

  test('빈 필드로 로그인 시도', async ({ page }) => {
    await page.goto('/login');
    
    // 빈 상태로 제출
    await page.click('button[type="submit"]');
    
    // HTML5 validation 또는 에러 메시지 확인
    const emailField = page.locator('[name="email"]');
    const passwordField = page.locator('[name="password"]');
    
    // 필수 필드 validation 확인
    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('로그인 후 로그아웃', async ({ page }) => {
    await loginAs(page, 'member');
    
    // 로그아웃 버튼 클릭
    await page.click('[data-testid="user-menu"]');
    await page.click('text=로그아웃');
    
    // 로그인 페이지로 리다이렉트 확인
    await page.waitForURL('/login');
    
    // 사용자 메뉴가 더 이상 보이지 않는지 확인
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('로그인 상태에서 /login 접근 시 대시보드로 리다이렉트', async ({ page }) => {
    await loginAs(page, 'member');
    
    // 로그인 페이지로 직접 접근
    await page.goto('/login');
    
    // 대시보드로 자동 리다이렉트 확인
    await page.waitForURL(url => !url.includes('/login'));
  });
});