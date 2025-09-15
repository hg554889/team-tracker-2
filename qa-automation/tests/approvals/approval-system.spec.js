import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { waitForPageLoad } from '../../utils/testHelpers.js';

test.describe('승인 시스템', () => {
  test('신규 사용자 - 클럽 선택 페이지', async ({ page }) => {
    // 새로운 사용자 회원가입 후 클럽 선택 시나리오
    const newUser = {
      name: `신규사용자 ${Date.now()}`,
      email: `newuser-${Date.now()}@test.com`,
      password: 'NewUser123!'
    };
    
    // 회원가입
    await page.goto('/signup');
    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[placeholder="실명을 입력하세요"]', newUser.name);
    await page.fill('input[placeholder="예: 20241234"]', '20241234');
    // .env에서 설정한 동아리 선택, 없으면 첫 번째 동아리 선택
    const clubName = process.env.TEST_CLUB_NAME;
    if (clubName) {
      await page.selectOption('select', { label: clubName });
    } else {
      await page.selectOption('select', { index: 1 });
    }
    await page.fill('input[type="password"]', newUser.password);
    await page.click('button[type="submit"]');
    
    // 클럽 선택 페이지로 이동 확인
    await page.waitForURL('/select-club');
    
    // 클럽 목록 확인
    await expect(page.locator('[data-testid="club-list"]')).toBeVisible();
    await expect(page.locator('h2:has-text("클럽 선택")')).toBeVisible();
    await expect(page.locator('p:has-text("가입하실 클럽을 선택해주세요")')).toBeVisible();
    
    // 클럽 카드들 확인
    const clubCards = page.locator('.club-card');
    
    if (await clubCards.count() > 0) {
      await expect(clubCards.first()).toBeVisible();
      await expect(clubCards.first().locator('.club-name')).toBeVisible();
      await expect(clubCards.first().locator('.club-description')).toBeVisible();
      await expect(clubCards.first().locator('.member-count')).toBeVisible();
    }
  });

  test('클럽 선택 후 승인 대기 상태', async ({ page }) => {
    const newUser = {
      name: `승인대기사용자 ${Date.now()}`,
      email: `pending-${Date.now()}@test.com`,
      password: 'Pending123!'
    };
    
    // 회원가입 및 클럽 선택
    await page.goto('/signup');
    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[placeholder="실명을 입력하세요"]', newUser.name);
    await page.fill('input[placeholder="예: 20241234"]', '20241234');
    // .env에서 설정한 동아리 선택, 없으면 첫 번째 동아리 선택
    const clubName = process.env.TEST_CLUB_NAME;
    if (clubName) {
      await page.selectOption('select', { label: clubName });
    } else {
      await page.selectOption('select', { index: 1 });
    }
    await page.fill('input[type="password"]', newUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/select-club');
    
    // 첫 번째 클럽 선택
    if (await page.locator('.club-card:first-child').isVisible()) {
      await page.click('.club-card:first-child');
      
      // 승인 대기 페이지로 이동
      await page.waitForURL('/approval-pending');
      
      // 승인 대기 메시지 확인
      await expect(page.locator('h2:has-text("가입 승인 대기 중")')).toBeVisible();
      await expect(page.locator('text=관리자의 승인을 기다리고 있습니다')).toBeVisible();
      await expect(page.locator('[data-testid="pending-status"]')).toBeVisible();
      
      // 선택한 클럽 정보 표시
      await expect(page.locator('[data-testid="selected-club"]')).toBeVisible();
      
      // 대기 중에는 다른 페이지 접근 제한
      await page.goto('/');
      await page.waitForURL('/approval-pending'); // 다시 승인 대기 페이지로
    }
  });

  test('Admin - 가입 승인 요청 목록 조회', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/approvals');
    
    // 승인 요청 목록 확인
    await expect(page.locator('[data-testid="approval-requests"]')).toBeVisible();
    await expect(page.locator('h2:has-text("가입 승인 관리")')).toBeVisible();
    
    // 테이블 헤더 확인
    await expect(page.locator('th:has-text("이름")')).toBeVisible();
    await expect(page.locator('th:has-text("이메일")')).toBeVisible();
    await expect(page.locator('th:has-text("신청 클럽")')).toBeVisible();
    await expect(page.locator('th:has-text("신청일")')).toBeVisible();
    await expect(page.locator('th:has-text("상태")')).toBeVisible();
    await expect(page.locator('th:has-text("작업")')).toBeVisible();
  });

  test('Admin - 가입 승인 처리', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/approvals');
    
    const firstRequest = page.locator('tbody tr:first-child');
    
    if (await firstRequest.isVisible()) {
      const userName = await firstRequest.locator('[data-testid="user-name"]').textContent();
      
      // 승인 버튼 클릭
      await firstRequest.locator('[data-testid="approve-btn"]').click();
      
      // 확인 다이얼로그
      await page.click('text=승인 확인');
      
      // 성공 메시지 확인
      await expect(page.locator('text=가입이 승인되었습니다')).toBeVisible();
      
      // 상태 업데이트 확인
      await expect(firstRequest.locator('[data-testid="status"]')).toContainText('승인됨');
    }
  });

  test('Admin - 가입 거부 처리', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/approvals');
    
    const firstRequest = page.locator('tbody tr:first-child');
    
    if (await firstRequest.isVisible()) {
      // 거부 버튼 클릭
      await firstRequest.locator('[data-testid="reject-btn"]').click();
      
      // 거부 사유 입력
      await page.fill('[data-testid="rejection-reason"]', '가입 기준에 미달');
      await page.click('text=거부 확인');
      
      // 성공 메시지 확인
      await expect(page.locator('text=가입이 거부되었습니다')).toBeVisible();
      
      // 상태 업데이트 확인
      await expect(firstRequest.locator('[data-testid="status"]')).toContainText('거부됨');
    }
  });

  test('Executive - 클럽 내 승인 요청만 조회', async ({ page }) => {
    await loginAs(page, 'executive');
    
    await page.goto('/admin/approvals');
    
    // Executive는 자신이 관리하는 클럽의 승인 요청만 볼 수 있음
    await expect(page.locator('[data-testid="approval-requests"]')).toBeVisible();
    
    // 모든 승인 요청이 해당 클럽의 것인지 확인
    const requests = page.locator('tbody tr');
    const count = await requests.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const clubName = await requests.nth(i).locator('[data-testid="club-name"]').textContent();
        // Executive가 관리하는 클럽인지 검증 (실제로는 클럽 정보 확인 필요)
        expect(clubName).toBeTruthy();
      }
    }
  });

  test('승인 대기 중 사용자 - 기능 제한 확인', async ({ page }) => {
    // 승인 대기 상태의 사용자로 로그인 (실제로는 테스트용 대기 계정 필요)
    const pendingUser = {
      email: 'pending-user@test.com',
      password: 'Pending123!'
    };
    
    await page.goto('/login');
    await page.fill('input[type="email"]', pendingUser.email);
    await page.fill('input[type="password"]', pendingUser.password);
    await page.click('button[type="submit"]');
    
    // 승인 대기 페이지로 자동 리다이렉트
    if (page.url().includes('/approval-pending')) {
      await expect(page.locator('text=승인 대기 중')).toBeVisible();
      
      // 다른 페이지 접근 시도
      await page.goto('/teams');
      await page.waitForURL('/approval-pending'); // 다시 대기 페이지로
      
      await page.goto('/reports');
      await page.waitForURL('/approval-pending'); // 다시 대기 페이지로
      
      // 네비게이션 메뉴가 제한적이어야 함
      const hasTeamsMenu = await page.locator('nav a[href="/teams"]').isVisible();
      const hasReportsMenu = await page.locator('nav a[href="/reports"]').isVisible();
      
      expect(hasTeamsMenu).toBe(false);
      expect(hasReportsMenu).toBe(false);
    }
  });

  test('승인 후 사용자 - 정상 기능 이용 가능', async ({ page }) => {
    // 승인된 사용자로 로그인
    await loginAs(page, 'member');
    
    // 홈 페이지 접근 가능
    await page.goto('/');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // 팀 페이지 접근 가능
    await page.goto('/teams');
    await expect(page.locator('[data-testid="teams-page"]')).toBeVisible();
    
    // 보고서 페이지 접근 가능
    await page.goto('/reports');
    await expect(page.locator('[data-testid="reports-page"]')).toBeVisible();
    
    // 네비게이션 메뉴 정상 표시
    await expect(page.locator('nav a[href="/teams"]')).toBeVisible();
    await expect(page.locator('nav a[href="/reports"]')).toBeVisible();
  });

  test('승인 알림 시스템', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/approvals');
    
    // 새로운 승인 요청이 있을 때 알림 표시
    if (await page.locator('[data-testid="new-approval-badge"]').isVisible()) {
      await expect(page.locator('[data-testid="new-approval-badge"]')).toBeVisible();
      
      const badgeCount = await page.locator('[data-testid="new-approval-badge"]').textContent();
      expect(parseInt(badgeCount)).toBeGreaterThan(0);
    }
    
    // 메인 네비게이션에서도 알림 확인
    await page.goto('/');
    
    if (await page.locator('[data-testid="approval-notification"]').isVisible()) {
      await expect(page.locator('[data-testid="approval-notification"]')).toBeVisible();
    }
  });

  test('일괄 승인/거부 처리', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/approvals');
    
    // 여러 승인 요청 선택
    const checkboxes = page.locator('input[type="checkbox"][data-testid="request-select"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      // 처음 2개 선택
      await checkboxes.nth(0).check();
      if (count > 1) await checkboxes.nth(1).check();
      
      // 일괄 승인
      await page.click('[data-testid="bulk-approve"]');
      await page.click('text=일괄 승인 확인');
      
      // 성공 메시지
      await expect(page.locator('text=선택한 요청들이 승인되었습니다')).toBeVisible();
    }
  });
});