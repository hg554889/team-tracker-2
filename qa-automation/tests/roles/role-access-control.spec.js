import { test, expect } from '@playwright/test';
import { loginAs, checkAccess } from '../../utils/authHelpers.js';
import { routes, roleAccessMap } from '../../config/routes.js';

test.describe('역할별 접근 제어', () => {
  test('ADMIN 권한 - 모든 페이지 접근 가능', async ({ page }) => {
    await loginAs(page, 'admin');
    
    const adminAccessibleRoutes = [
      routes.protected.home,
      routes.protected.teams,
      routes.protected.profile,
      routes.admin.users,
      routes.admin.clubs,
      routes.admin.settings,
      routes.admin.analytics,
      routes.admin.approvals,
      routes.admin.inquiries,
      routes.executive.users,
    ];

    for (const route of adminAccessibleRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // 403 에러 페이지나 unauthorized 메시지가 없는지 확인
      const hasUnauthorized = await page.locator('text=권한이 없습니다').isVisible();
      const has403 = await page.locator('text=403').isVisible();
      
      expect(hasUnauthorized).toBe(false);
      expect(has403).toBe(false);
      expect(page.url()).toContain(route);
    }
  });

  test('EXECUTIVE 권한 - Executive 및 공통 페이지 접근 가능', async ({ page }) => {
    await loginAs(page, 'executive');
    
    // 접근 가능한 페이지들
    const accessibleRoutes = [
      routes.protected.home,
      routes.protected.teams,
      routes.protected.profile,
      routes.executive.users,
      routes.admin.approvals, // Executive도 승인 관리 가능
      routes.admin.inquiries,  // Executive도 문의 관리 가능
    ];

    for (const route of accessibleRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const hasUnauthorized = await page.locator('text=권한이 없습니다').isVisible();
      expect(hasUnauthorized).toBe(false);
    }
  });

  test('EXECUTIVE 권한 - Admin 전용 페이지 접근 불가', async ({ page }) => {
    await loginAs(page, 'executive');
    
    // 접근 불가능한 페이지들
    const restrictedRoutes = [
      routes.admin.clubs,
      routes.admin.settings, 
      routes.admin.analytics,
      routes.admin.users,
    ];

    for (const route of restrictedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // 리다이렉트되거나 권한 없음 메시지 확인
      const isRedirected = !page.url().includes(route);
      const hasUnauthorized = await page.locator('text=권한이 없습니다').isVisible();
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    }
  });

  test('LEADER 권한 - Leader 및 공통 페이지 접근 가능', async ({ page }) => {
    await loginAs(page, 'leader');
    
    const accessibleRoutes = [
      routes.protected.home,
      routes.protected.teams,
      routes.protected.profile,
      routes.protected.reportsNew,
      routes.leader.teamInvite,
    ];

    for (const route of accessibleRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const hasUnauthorized = await page.locator('text=권한이 없습니다').isVisible();
      expect(hasUnauthorized).toBe(false);
    }
  });

  test('LEADER 권한 - Admin/Executive 전용 페이지 접근 불가', async ({ page }) => {
    await loginAs(page, 'leader');
    
    const restrictedRoutes = [
      routes.admin.users,
      routes.admin.clubs,
      routes.admin.settings,
      routes.admin.analytics,
      routes.admin.approvals,
      routes.admin.inquiries,
      routes.executive.users,
    ];

    for (const route of restrictedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const isRedirected = !page.url().includes(route);
      const hasUnauthorized = await page.locator('text=권한이 없습니다').isVisible();
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    }
  });

  test('MEMBER 권한 - 기본 페이지만 접근 가능', async ({ page }) => {
    await loginAs(page, 'member');
    
    const accessibleRoutes = [
      routes.protected.home,
      routes.protected.teams,
      routes.protected.profile,
      routes.protected.reportsNew,
      routes.protected.reportsList,
    ];

    for (const route of accessibleRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const hasUnauthorized = await page.locator('text=권한이 없습니다').isVisible();
      expect(hasUnauthorized).toBe(false);
    }
  });

  test('MEMBER 권한 - 관리자/리더 전용 기능 접근 불가', async ({ page }) => {
    await loginAs(page, 'member');
    
    const restrictedRoutes = [
      routes.admin.users,
      routes.admin.clubs,
      routes.admin.settings,
      routes.leader.teamInvite,
      routes.executive.users,
    ];

    for (const route of restrictedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const isRedirected = !page.url().includes(route);
      const hasUnauthorized = await page.locator('text=권한이 없습니다').isVisible();
      
      expect(isRedirected || hasUnauthorized).toBe(true);
    }
  });

  test('네비게이션 메뉴 - 권한별 메뉴 항목 표시', async ({ page }) => {
    // Admin 로그인 시 모든 메뉴 표시
    await loginAs(page, 'admin');
    await page.goto('/');
    
    await expect(page.locator('text=사용자 관리')).toBeVisible();
    await expect(page.locator('text=클럽 관리')).toBeVisible();
    await expect(page.locator('text=시스템 설정')).toBeVisible();
    
    // Member 로그인 시 기본 메뉴만 표시
    await loginAs(page, 'member');
    await page.goto('/');
    
    const hasAdminMenu = await page.locator('text=사용자 관리').isVisible();
    const hasClubMenu = await page.locator('text=클럽 관리').isVisible();
    
    expect(hasAdminMenu).toBe(false);
    expect(hasClubMenu).toBe(false);
  });

  test('API 엔드포인트 권한 제어', async ({ page }) => {
    await loginAs(page, 'member');
    
    // Member가 Admin API 호출 시 403 응답 확인
    const response = await page.request.get('/api/admin/users');
    expect(response.status()).toBe(403);
    
    // Member가 접근 가능한 API는 200 응답
    const teamResponse = await page.request.get('/api/teams');
    expect(teamResponse.status()).toBe(200);
  });
});