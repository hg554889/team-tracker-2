import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { waitForPageLoad } from '../../utils/testHelpers.js';

test.describe('Admin 관리 기능', () => {
  test('사용자 관리 - 전체 사용자 목록 조회', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/users');
    
    // 사용자 목록 테이블 확인 (실제 DOM 구조 반영)
    await expect(page.locator('table.table')).toBeVisible();
    await expect(page.locator('th:has-text("이름")')).toBeVisible();
    await expect(page.locator('th:has-text("이메일")')).toBeVisible();
    await expect(page.locator('th:has-text("권한")')).toBeVisible(); // "역할" → "권한"
    await expect(page.locator('th:has-text("소속 동아리")')).toBeVisible(); // "클럽" → "소속 동아리"
  });

  test('사용자 역할 변경', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/users');
    
    // 첫 번째 사용자의 역할 변경
    const firstUserRow = page.locator('tbody tr:first-child');
    
    if (await firstUserRow.isVisible()) {
      await firstUserRow.locator('[data-testid="role-dropdown"]').click();
      await page.click('text=Leader');
      
      // 확인 다이얼로그
      await page.click('text=역할 변경 확인');
      
      // 성공 메시지 확인
      await expect(page.locator('text=사용자 역할이 변경되었습니다')).toBeVisible();
    }
  });

  test('사용자 계정 비활성화', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/users');
    
    const firstUserRow = page.locator('tbody tr:first-child');
    
    if (await firstUserRow.isVisible()) {
      await firstUserRow.locator('[data-testid="user-actions"]').click();
      await page.click('text=계정 비활성화');
      
      // 확인 다이얼로그
      await page.fill('[placeholder="비활성화 사유를 입력하세요"]', '테스트용 비활성화');
      await page.click('text=비활성화 확인');
      
      // 비활성화 상태 확인
      await expect(firstUserRow.locator('[data-testid="user-status"]')).toContainText('비활성');
    }
  });

  test('클럽 관리 - 새 클럽 생성', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/clubs');
    
    await page.click('text=새 클럽 생성');
    
    const clubName = `QA 테스트 클럽 ${Date.now()}`;
    
    await page.fill('[name="name"]', clubName);
    await page.fill('[name="description"]', 'QA 자동화 테스트용 클럽');
    await page.fill('[name="maxMembers"]', '100');
    await page.click('button[type="submit"]');
    
    // 성공 메시지 및 클럽 목록에 추가 확인
    await expect(page.locator('text=클럽이 생성되었습니다')).toBeVisible();
    await expect(page.locator(`text=${clubName}`)).toBeVisible();
  });

  test('클럽 정보 수정', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/clubs');
    
    // 첫 번째 클럽 수정
    const firstClubRow = page.locator('.club-card:first-child');
    
    if (await firstClubRow.isVisible()) {
      await firstClubRow.locator('[data-testid="edit-club"]').click();
      
      const updatedName = `수정된 클럽명 ${Date.now()}`;
      await page.fill('[name="name"]', updatedName);
      await page.fill('[name="description"]', '수정된 클럽 설명');
      await page.click('text=저장');
      
      // 수정 확인
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    }
  });

  test('클럽 삭제', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/clubs');
    
    const firstClubRow = page.locator('.club-card:first-child');
    
    if (await firstClubRow.isVisible()) {
      const clubName = await firstClubRow.locator('[data-testid="club-name"]').textContent();
      
      await firstClubRow.locator('[data-testid="delete-club"]').click();
      
      // 삭제 확인 다이얼로그
      await page.fill('[placeholder="삭제할 클럽 이름을 입력하세요"]', clubName);
      await page.click('text=삭제 확인');
      
      // 삭제 확인
      await expect(page.locator(`text=${clubName}`)).not.toBeVisible();
    }
  });

  test('시스템 설정 관리', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/settings');
    
    // 시스템 설정 페이지 확인
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
    
    // 주요 설정 항목들 확인
    await expect(page.locator('text=사이트 제목')).toBeVisible();
    await expect(page.locator('text=최대 파일 크기')).toBeVisible();
    await expect(page.locator('text=회원가입 승인 필요')).toBeVisible();
    
    // 설정 변경
    await page.fill('[name="siteTitle"]', 'Team Tracker v2 - QA Test');
    await page.fill('[name="maxFileSize"]', '10');
    await page.click('[name="requireApproval"]');
    
    await page.click('text=설정 저장');
    
    // 저장 확인
    await expect(page.locator('text=설정이 저장되었습니다')).toBeVisible();
  });

  test('시스템 분석 데이터 조회', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/analytics');
    
    // 분석 대시보드 확인
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    
    // 주요 통계 위젯들
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-clubs"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-teams"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-reports"]')).toBeVisible();
    
    // 차트들
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-chart"]')).toBeVisible();
    
    // 기간 필터링
    await page.selectOption('[data-testid="period-filter"]', 'month');
    await waitForPageLoad(page);
    
    // 차트 업데이트 확인 (데이터 변경)
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
  });

  test('사용자 검색 및 필터링', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/users');
    
    // 이름으로 검색
    await page.fill('[data-testid="user-search"]', 'QA');
    await page.press('[data-testid="user-search"]', 'Enter');
    
    // 검색 결과 확인
    const userRows = page.locator('tbody tr');
    const count = await userRows.count();
    
    for (let i = 0; i < count; i++) {
      const userName = await userRows.nth(i).locator('[data-testid="user-name"]').textContent();
      expect(userName.toLowerCase()).toContain('qa');
    }
    
    // 역할별 필터링
    await page.selectOption('[data-testid="role-filter"]', 'MEMBER');
    await waitForPageLoad(page);
    
    // 필터링 결과 확인
    const filteredRows = page.locator('tbody tr');
    const filteredCount = await filteredRows.count();
    
    for (let i = 0; i < filteredCount; i++) {
      const userRole = await filteredRows.nth(i).locator('[data-testid="user-role"]').textContent();
      expect(userRole).toBe('MEMBER');
    }
  });

  test('사용자 일괄 작업', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/users');
    
    // 여러 사용자 선택
    const checkboxes = page.locator('input[type="checkbox"][data-testid="user-select"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      // 처음 2명 선택
      await checkboxes.nth(0).check();
      if (count > 1) await checkboxes.nth(1).check();
      
      // 일괄 작업 메뉴
      await page.click('[data-testid="bulk-actions"]');
      await page.click('text=선택한 사용자 역할 변경');
      
      // 역할 선택
      await page.selectOption('[data-testid="bulk-role-select"]', 'LEADER');
      await page.click('text=일괄 변경 확인');
      
      // 성공 메시지 확인
      await expect(page.locator('text=선택한 사용자들의 역할이 변경되었습니다')).toBeVisible();
    }
  });

  test('시스템 로그 조회', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/settings');
    
    // 시스템 로그 탭으로 이동
    if (await page.locator('text=시스템 로그').isVisible()) {
      await page.click('text=시스템 로그');
      
      // 로그 목록 확인
      await expect(page.locator('[data-testid="system-logs"]')).toBeVisible();
      
      // 로그 레벨 필터링
      await page.selectOption('[data-testid="log-level-filter"]', 'ERROR');
      await waitForPageLoad(page);
      
      // 에러 로그만 표시되는지 확인
      const logEntries = page.locator('.log-entry');
      const logCount = await logEntries.count();
      
      for (let i = 0; i < logCount; i++) {
        const logLevel = await logEntries.nth(i).locator('.log-level').textContent();
        expect(logLevel).toBe('ERROR');
      }
    }
  });

  test('데이터베이스 백업 기능', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin/settings');
    
    // 데이터베이스 관리 탭
    if (await page.locator('text=데이터베이스 관리').isVisible()) {
      await page.click('text=데이터베이스 관리');
      
      // 백업 생성
      await page.click('text=백업 생성');
      
      // 백업 진행 상태 확인
      await expect(page.locator('text=백업 생성 중...')).toBeVisible();
      
      // 백업 완료 확인 (시간이 걸릴 수 있음)
      await expect(page.locator('text=백업이 완료되었습니다')).toBeVisible({ timeout: 30000 });
      
      // 백업 목록에 새 백업 파일 확인
      await expect(page.locator('[data-testid="backup-list"]')).toBeVisible();
    }
  });
});