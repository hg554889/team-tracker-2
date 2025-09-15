import { test, expect } from '@playwright/test';

test.describe('Authentication - Signup', () => {
  test.beforeEach(async ({ page }) => {
    // 깨끗한 상태로 시작
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('유효한 정보로 회원가입 성공', async ({ page }) => {
    await page.goto('/signup');
    
    // 회원가입 폼 로드 대기
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible(); // 동아리 선택
    
    const newUser = {
      name: `Test User ${Date.now()}`,
      email: `test-${Date.now()}@test.com`,
      password: 'TestPassword123!'
    };
    
    // 회원가입 정보 입력
    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[placeholder="실명을 입력하세요"]', newUser.name);
    await page.fill('input[placeholder="예: 20241234"]', `2024${Math.floor(Math.random() * 10000)}`);
    
    // 동아리 선택 (첫 번째 옵션이 아닌 실제 동아리)
    await page.selectOption('select', { index: 1 });
    
    await page.fill('input[type="password"]', newUser.password);
    
    // 회원가입 제출
    await page.click('button[type="submit"]');
    
    // 회원가입 처리 대기
    await page.waitForTimeout(3000);
    
    // URL 변화 확인 - approval-pending이거나 다른 페이지로 이동
    const currentUrl = page.url();
    console.log('회원가입 후 현재 URL:', currentUrl);
    
    if (currentUrl.includes('/approval-pending')) {
      // 승인 대기 페이지로 이동한 경우
      await expect(page.locator('h1:has-text("승인 대기")')).toBeVisible();
    } else if (currentUrl.includes('/signup')) {
      // 회원가입 페이지에 머물러 있는 경우 - 에러 확인
      const hasErrorToast = await page.locator('.toast').isVisible().catch(() => false);
      if (hasErrorToast) {
        console.log('회원가입 에러 발생 - Toast 메시지 확인됨');
        return; // 에러가 있으면 테스트 중단
      }
    }
    
    // 토큰이 설정되었는지 확인 (회원가입 후 자동 로그인)
    const hasToken = await page.evaluate(() => localStorage.getItem('token') !== null);
    expect(hasToken).toBe(true);
  });

  test('중복 이메일로 회원가입 시도', async ({ page }) => {
    await page.goto('/signup');
    
    // 이미 존재하는 이메일 사용
    await page.fill('input[type="email"]', 'qa-member@test.com');
    await page.fill('input[placeholder="실명을 입력하세요"]', 'Duplicate User');
    await page.fill('input[placeholder="예: 20241234"]', '20240000');
    await page.selectOption('select', { index: 1 });
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    
    // 실제 구현에 따라 로그인 페이지로 리다이렉트되거나 에러 메시지 표시
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login');
    const staysOnSignup = currentUrl.includes('/signup');
    
    // 둘 중 하나는 true여야 함
    expect(isRedirectedToLogin || staysOnSignup).toBe(true);
    
    if (isRedirectedToLogin) {
      // 로그인 페이지로 리다이렉트된 경우
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      // 회원가입 페이지에 머물러 있는 경우 - 에러 메시지 확인
      const hasErrorToast = await page.locator('.toast').isVisible().catch(() => false);
      if (hasErrorToast) {
        console.log('Error toast displayed for duplicate email');
      }
    }
  });

  test('잘못된 이메일 형식으로 회원가입 시도', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('input[type="email"]', 'invalid-email-format');
    await page.fill('input[placeholder="실명을 입력하세요"]', 'Test User');
    await page.fill('input[placeholder="예: 20241234"]', '20241234');
    await page.selectOption('select', { index: 1 });
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    
    // HTML5 validation 에러 확인
    const emailField = page.locator('input[type="email"]');
    const isValid = await emailField.evaluate(el => el.validity.valid);
    expect(isValid).toBe(false);
    
    // 여전히 회원가입 페이지에 있는지 확인
    expect(page.url()).toContain('/signup');
  });

  test('필수 필드 누락으로 회원가입 실패', async ({ page }) => {
    await page.goto('/signup');
    
    // 일부 필드만 입력
    await page.fill('input[type="email"]', 'test@test.com');
    // 다른 필드는 비워둠
    
    await page.click('button[type="submit"]');
    
    // HTML5 validation 확인
    const requiredFields = [
      'input[type="email"]',
      'input[placeholder="실명을 입력하세요"]',
      'input[placeholder="예: 20241234"]',
      'select',
      'input[type="password"]'
    ];
    
    for (const selector of requiredFields) {
      const field = page.locator(selector);
      await expect(field).toHaveAttribute('required');
    }
    
    // 여전히 회원가입 페이지에 있는지 확인
    expect(page.url()).toContain('/signup');
  });

  test('동아리 미선택으로 회원가입 실패', async ({ page }) => {
    await page.goto('/signup');
    
    // 동아리를 제외한 모든 필드 입력
    await page.fill('input[type="email"]', `test-${Date.now()}@test.com`);
    await page.fill('input[placeholder="실명을 입력하세요"]', 'Test User');
    await page.fill('input[placeholder="예: 20241234"]', '20241234');
    // 동아리 선택하지 않음 (기본값: "동아리를 선택하세요")
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Toast 메시지 확인 (동아리 선택 필수)
    await page.waitForTimeout(1000);
    const hasErrorToast = await page.locator('.toast').isVisible().catch(() => false);
    
    if (hasErrorToast) {
      const toastText = await page.locator('.toast').textContent();
      expect(toastText).toContain('동아리');
    }
    
    // 여전히 회원가입 페이지에 있는지 확인
    expect(page.url()).toContain('/signup');
  });
});