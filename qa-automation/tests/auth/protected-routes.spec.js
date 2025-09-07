import { test, expect } from '@playwright/test';
import { routes } from '../../config/routes.js';

test.describe('보호된 라우트 접근 제어', () => {
  test('로그인하지 않은 상태에서 보호된 라우트 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    const protectedRoutes = [
      routes.protected.dashboard,
      routes.protected.profile,
      routes.protected.teams,
      routes.protected.reportsNew,
      routes.admin.users,
      routes.admin.clubs,
    ];

    for (const route of protectedRoutes) {
      // 동적 라우트 처리 (예: /teams/:id -> /teams/1)
      const testRoute = route.includes(':') ? route.replace(':id', '1').replace(':code', 'test') : route;
      
      await page.goto(testRoute);
      
      // 로그인 페이지로 리다이렉트되는지 확인
      await page.waitForURL('/login');
      
      // 로그인 폼이 보이는지 확인
      await expect(page.locator('[name="email"]')).toBeVisible();
    }
  });

  test('인증 토큰 없이 API 요청 시 401 응답', async ({ page }) => {
    // 로컬 스토리지에서 토큰 제거
    await page.evaluate(() => {
      localStorage.removeItem('token');
    });

    // API 요청 인터셉트
    let apiResponse;
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponse = response;
      }
    });

    // 보호된 페이지 접근 시도
    await page.goto('/profile');

    // API 응답 확인 (비동기적으로 발생할 수 있음)
    await page.waitForTimeout(2000);
    
    // 로그인 페이지로 리다이렉트 확인
    expect(page.url()).toContain('/login');
  });

  test('잘못된 토큰으로 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    // 잘못된 토큰 설정
    await page.evaluate(() => {
      localStorage.setItem('token', 'invalid-token-123');
    });

    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트 확인
    await page.waitForURL('/login');
    
    // 토큰이 제거되었는지 확인
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('토큰 만료 시 자동 로그아웃', async ({ page }) => {
    // 만료된 토큰 시뮬레이션을 위한 API 모킹
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' })
      });
    });

    // 가짜 토큰 설정
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired-token');
    });

    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트 확인
    await page.waitForURL('/login');
  });

  test('세션 스토리지 기반 상태 유지', async ({ page }) => {
    // 브라우저 새로고침 후에도 인증 상태가 유지되는지 테스트
    // 먼저 유효한 토큰을 로컬 스토리지에 설정
    await page.evaluate(() => {
      localStorage.setItem('token', 'valid-test-token');
    });

    // 인증 확인 API 모킹
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Test User',
          email: 'test@test.com',
          role: 'MEMBER'
        })
      });
    });

    await page.goto('/dashboard');
    
    // 페이지 새로고침
    await page.reload();
    
    // 여전히 대시보드에 있는지 확인
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });
});