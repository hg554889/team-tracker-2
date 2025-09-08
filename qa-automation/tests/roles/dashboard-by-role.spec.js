import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';

test.describe('역할별 대시보드 표시', () => {
  test('ADMIN 대시보드 - 시스템 전체 관리 위젯 표시', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/');
    
    // Admin 전용 위젯들 확인
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('text=전체 사용자 통계')).toBeVisible();
    await expect(page.locator('text=클럽 관리')).toBeVisible();
    await expect(page.locator('text=시스템 현황')).toBeVisible();
    await expect(page.locator('text=승인 대기 목록')).toBeVisible();
    
    // 빠른 작업 버튼들
    await expect(page.locator('text=새 클럽 생성')).toBeVisible();
    await expect(page.locator('text=사용자 관리')).toBeVisible();
    await expect(page.locator('text=시스템 설정')).toBeVisible();
  });

  test('EXECUTIVE 대시보드 - 클럽 관리 위젯 표시', async ({ page }) => {
    await loginAs(page, 'executive');
    await page.goto('/');
    
    // Executive 전용 위젯들 확인
    await expect(page.locator('[data-testid="executive-dashboard"]')).toBeVisible();
    await expect(page.locator('text=클럽 현황')).toBeVisible();
    await expect(page.locator('text=소속 팀 관리')).toBeVisible();
    await expect(page.locator('text=승인 관리')).toBeVisible();
    
    // Executive 권한 빠른 작업
    await expect(page.locator('text=팀 승인 관리')).toBeVisible();
    await expect(page.locator('text=클럽 멤버 관리')).toBeVisible();
    
    // Admin 전용 기능은 보이지 않아야 함
    const hasSystemManagement = await page.locator('text=시스템 관리').isVisible();
    expect(hasSystemManagement).toBe(false);
  });

  test('LEADER 대시보드 - 팀 관리 위젯 표시', async ({ page }) => {
    await loginAs(page, 'leader');
    await page.goto('/');
    
    // Leader 전용 위젯들 확인
    await expect(page.locator('[data-testid="leader-dashboard"]')).toBeVisible();
    await expect(page.locator('text=내 팀 현황')).toBeVisible();
    await expect(page.locator('text=팀 성과 분석')).toBeVisible();
    await expect(page.locator('text=보고서 관리')).toBeVisible();
    await expect(page.locator('text=팀원 관리')).toBeVisible();
    
    // Leader 권한 빠른 작업
    await expect(page.locator('text=새 보고서 작성')).toBeVisible();
    await expect(page.locator('text=팀원 초대')).toBeVisible();
    await expect(page.locator('text=팀 설정')).toBeVisible();
  });

  test('MEMBER 대시보드 - 기본 활동 위젯 표시', async ({ page }) => {
    await loginAs(page, 'member');
    await page.goto('/');
    
    // Member 전용 위젯들 확인
    await expect(page.locator('[data-testid="member-dashboard"]')).toBeVisible();
    await expect(page.locator('text=내 활동 현황')).toBeVisible();
    await expect(page.locator('text=소속 팀 정보')).toBeVisible();
    await expect(page.locator('text=최근 보고서')).toBeVisible();
    await expect(page.locator('text=할 일 목록')).toBeVisible();
    
    // Member 권한 빠른 작업
    await expect(page.locator('text=보고서 작성')).toBeVisible();
    await expect(page.locator('text=팀 채팅')).toBeVisible();
    
    // 관리 기능들은 보이지 않아야 함
    const hasTeamManagement = await page.locator('text=팀원 관리').isVisible();
    const hasUserManagement = await page.locator('text=사용자 관리').isVisible();
    
    expect(hasTeamManagement).toBe(false);
    expect(hasUserManagement).toBe(false);
  });

  test('대시보드 통계 위젯 - 권한별 다른 데이터 표시', async ({ page }) => {
    // Admin - 전체 시스템 통계
    await loginAs(page, 'admin');
    await page.goto('/');
    
    await expect(page.locator('[data-testid="total-users-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-clubs-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-teams-count"]')).toBeVisible();
    
    // Leader - 내 팀 통계만
    await loginAs(page, 'leader');
    await page.goto('/');
    
    await expect(page.locator('[data-testid="my-team-members-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="my-team-reports-count"]')).toBeVisible();
    
    // 전체 시스템 통계는 보이지 않아야 함
    const hasTotalUsers = await page.locator('[data-testid="total-users-count"]').isVisible();
    expect(hasTotalUsers).toBe(false);
  });

  test('알림 센터 - 권한별 다른 알림 표시', async ({ page }) => {
    // Admin - 시스템 전체 알림
    await loginAs(page, 'admin');
    await page.goto('/');
    
    await page.click('[data-testid="notification-center"]');
    
    await expect(page.locator('text=새로운 가입 승인 요청')).toBeVisible();
    await expect(page.locator('text=시스템 업데이트')).toBeVisible();
    
    // Member - 개인 관련 알림만
    await loginAs(page, 'member');
    await page.goto('/');
    
    await page.click('[data-testid="notification-center"]');
    
    await expect(page.locator('text=새로운 댓글')).toBeVisible();
    await expect(page.locator('text=보고서 마감 알림')).toBeVisible();
    
    // 시스템 관련 알림은 보이지 않아야 함
    const hasSystemNotification = await page.locator('text=시스템 업데이트').isVisible();
    expect(hasSystemNotification).toBe(false);
  });

  test('빠른 작업 버튼 - 권한에 따른 동작 제한', async ({ page }) => {
    // Leader 권한으로 팀 생성 버튼 클릭
    await loginAs(page, 'leader');
    await page.goto('/');
    
    await page.click('text=새 팀 만들기');
    await page.waitForURL('/teams/new');
    
    // 팀 생성 페이지로 정상 이동 확인
    await expect(page.locator('text=팀 생성')).toBeVisible();
    
    // Member 권한으로는 팀 생성 버튼이 없어야 함
    await loginAs(page, 'member');
    await page.goto('/');
    
    const hasCreateTeamButton = await page.locator('text=새 팀 만들기').isVisible();
    expect(hasCreateTeamButton).toBe(false);
  });

  test('차트 및 그래프 - 권한별 데이터 범위', async ({ page }) => {
    // Admin - 전체 시스템 차트
    await loginAs(page, 'admin');
    await page.goto('/');
    
    await expect(page.locator('[data-testid="system-performance-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    
    // Leader - 팀별 차트만
    await loginAs(page, 'leader');
    await page.goto('/');
    
    await expect(page.locator('[data-testid="team-progress-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-activity-chart"]')).toBeVisible();
    
    // 시스템 전체 차트는 보이지 않아야 함
    const hasSystemChart = await page.locator('[data-testid="system-performance-chart"]').isVisible();
    expect(hasSystemChart).toBe(false);
  });
});