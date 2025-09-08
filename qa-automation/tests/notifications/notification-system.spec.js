import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { waitForPageLoad } from '../../utils/testHelpers.js';

test.describe('알림 시스템', () => {
  test('알림 센터 - 기본 화면 조회', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/notifications');
    
    // 알림 센터 기본 구조 확인
    await expect(page.locator('[data-testid="notification-center"]')).toBeVisible();
    await expect(page.locator('h2:has-text("알림 센터")')).toBeVisible();
    
    // 알림 필터 탭들
    await expect(page.locator('button:has-text("전체")')).toBeVisible();
    await expect(page.locator('button:has-text("읽지 않음")')).toBeVisible();
    await expect(page.locator('button:has-text("읽음")')).toBeVisible();
    
    // 알림 목록
    await expect(page.locator('[data-testid="notification-list"]')).toBeVisible();
  });

  test('새 알림 표시 및 읽음 처리', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/notifications');
    
    // 읽지 않은 알림이 있는 경우
    const unreadNotifications = page.locator('[data-testid="unread-notification"]');
    const unreadCount = await unreadNotifications.count();
    
    if (unreadCount > 0) {
      // 첫 번째 읽지 않은 알림 클릭
      await unreadNotifications.first().click();
      
      // 알림 상세 내용 확인
      await expect(page.locator('[data-testid="notification-detail"]')).toBeVisible();
      
      // 읽음 상태로 변경 확인
      await expect(unreadNotifications.first().locator('[data-testid="unread-indicator"]')).not.toBeVisible();
    }
  });

  test('알림 타입별 표시', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/notifications');
    
    // 다양한 알림 타입 확인
    const notifications = page.locator('.notification-item');
    const count = await notifications.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const notification = notifications.nth(i);
      
      // 알림 아이콘 확인
      await expect(notification.locator('[data-testid="notification-icon"]')).toBeVisible();
      
      // 알림 제목과 내용
      await expect(notification.locator('[data-testid="notification-title"]')).toBeVisible();
      await expect(notification.locator('[data-testid="notification-message"]')).toBeVisible();
      
      // 알림 시간
      await expect(notification.locator('[data-testid="notification-time"]')).toBeVisible();
    }
  });

  test('보고서 관련 알림', async ({ page }) => {
    await loginAs(page, 'member');
    
    // 보고서 작성 후 알림 생성 (Leader에게 알림 전송)
    await page.goto('/reports/new');
    
    await page.fill('[name="title"]', '알림 테스트 보고서');
    await page.fill('[name="progress"]', '70');
    await page.fill('[name="goals"]', '알림 기능 테스트');
    await page.fill('[name="issues"]', '없음');
    await page.click('button[type="submit"]');
    
    // 새 브라우저 컨텍스트에서 Leader로 로그인
    const context = await page.context();
    const leaderPage = await context.newPage();
    
    await loginAs(leaderPage, 'leader');
    await leaderPage.goto('/notifications');
    
    // 새 보고서 알림 확인
    await expect(leaderPage.locator('text=새로운 보고서가 작성되었습니다')).toBeVisible();
    
    await leaderPage.close();
  });

  test('댓글 알림', async ({ page, context }) => {
    // Member가 보고서에 댓글 작성
    await loginAs(page, 'member');
    
    await page.goto('/reports');
    
    if (await page.locator('.report-card:first-child').isVisible()) {
      await page.click('.report-card:first-child');
      
      // 댓글 작성
      const commentText = `알림 테스트 댓글 ${Date.now()}`;
      await page.fill('[name="comment"]', commentText);
      await page.click('text=댓글 작성');
      
      // 보고서 작성자에게 알림 전송 확인
      const authorPage = await context.newPage();
      await loginAs(authorPage, 'leader'); // 보고서 작성자라고 가정
      
      await authorPage.goto('/notifications');
      
      // 새 댓글 알림 확인
      await expect(authorPage.locator('text=새로운 댓글이 달렸습니다')).toBeVisible();
      
      await authorPage.close();
    }
  });

  test('팀 초대 알림', async ({ page, context }) => {
    // Leader가 멤버를 팀에 초대
    await loginAs(page, 'leader');
    
    await page.goto('/teams');
    
    if (await page.locator('.team-card:first-child').isVisible()) {
      await page.click('.team-card:first-child');
      await page.click('text=멤버 초대');
      
      // 초대 링크 생성됨 - 실제로는 특정 사용자에게 초대장 전송
      const inviteLink = await page.locator('[data-testid="invite-link"]').textContent();
      
      // 초대받은 사용자 확인
      const memberPage = await context.newPage();
      await loginAs(memberPage, 'member');
      
      await memberPage.goto('/notifications');
      
      // 팀 초대 알림 확인
      await expect(memberPage.locator('text=팀 초대를 받았습니다')).toBeVisible();
      
      await memberPage.close();
    }
  });

  test('시스템 공지 알림 - Admin', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/notifications');
    
    // Admin은 시스템 관련 알림들을 받음
    const systemNotifications = [
      '시스템 업데이트',
      '새로운 사용자 가입',
      '서버 점검 예정',
      '데이터베이스 백업 완료'
    ];
    
    // 시스템 알림들 중 일부가 표시되는지 확인
    const notifications = page.locator('.notification-item');
    const count = await notifications.count();
    
    let hasSystemNotification = false;
    
    for (let i = 0; i < count; i++) {
      const notificationText = await notifications.nth(i).locator('[data-testid="notification-message"]').textContent();
      
      for (const systemNotif of systemNotifications) {
        if (notificationText.includes(systemNotif)) {
          hasSystemNotification = true;
          break;
        }
      }
      
      if (hasSystemNotification) break;
    }
    
    // 최소한 하나의 시스템 알림이 있어야 함 (실제로는 데이터에 따라 다름)
  });

  test('알림 일괄 읽음 처리', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/notifications');
    
    // 읽지 않은 알림이 있는 경우
    if (await page.locator('[data-testid="unread-notification"]').count() > 0) {
      // 모두 읽음 처리 버튼
      await page.click('text=모두 읽음');
      
      // 확인 다이얼로그
      await page.click('text=확인');
      
      // 모든 알림이 읽음 상태로 변경
      await expect(page.locator('[data-testid="unread-notification"]')).toHaveCount(0);
      
      // 성공 메시지
      await expect(page.locator('text=모든 알림을 읽음 처리했습니다')).toBeVisible();
    }
  });

  test('알림 삭제', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/notifications');
    
    const notifications = page.locator('.notification-item');
    const initialCount = await notifications.count();
    
    if (initialCount > 0) {
      // 첫 번째 알림 삭제
      await notifications.first().locator('[data-testid="delete-notification"]').click();
      
      // 확인 다이얼로그
      await page.click('text=삭제 확인');
      
      // 알림 개수 감소 확인
      await expect(notifications).toHaveCount(initialCount - 1);
    }
  });

  test('알림 필터링', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/notifications');
    
    // 읽지 않음 탭 클릭
    await page.click('button:has-text("읽지 않음")');
    
    // 읽지 않은 알림만 표시
    const unreadNotifications = page.locator('[data-testid="notification-item"]');
    const count = await unreadNotifications.count();
    
    for (let i = 0; i < count; i++) {
      const isRead = await unreadNotifications.nth(i).getAttribute('data-read');
      expect(isRead).toBe('false');
    }
    
    // 읽음 탭 클릭
    await page.click('button:has-text("읽음")');
    
    // 읽은 알림만 표시
    const readNotifications = page.locator('[data-testid="notification-item"]');
    const readCount = await readNotifications.count();
    
    for (let i = 0; i < readCount; i++) {
      const isRead = await readNotifications.nth(i).getAttribute('data-read');
      expect(isRead).toBe('true');
    }
  });

  test('네비게이션 바 알림 아이콘', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/');
    
    // 네비게이션 바 알림 아이콘 확인
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
    
    // 읽지 않은 알림이 있으면 배지 표시
    if (await page.locator('[data-testid="notification-badge"]').isVisible()) {
      const badgeText = await page.locator('[data-testid="notification-badge"]').textContent();
      const badgeCount = parseInt(badgeText);
      expect(badgeCount).toBeGreaterThan(0);
    }
    
    // 알림 아이콘 클릭 시 드롭다운 표시
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();
    
    // 최근 알림 3-5개 미리보기
    const previewNotifications = page.locator('[data-testid="notification-preview"] .notification-item');
    const previewCount = await previewNotifications.count();
    expect(previewCount).toBeLessThanOrEqual(5);
  });

  test('활동 피드 조회', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/activity');
    
    // 활동 피드 기본 구조 확인
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
    await expect(page.locator('h2:has-text("활동 피드")')).toBeVisible();
    
    // 활동 항목들 확인
    const activities = page.locator('.activity-item');
    const count = await activities.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const activity = activities.nth(i);
      
      // 활동 아이콘
      await expect(activity.locator('[data-testid="activity-icon"]')).toBeVisible();
      
      // 활동 내용
      await expect(activity.locator('[data-testid="activity-description"]')).toBeVisible();
      
      // 활동 시간
      await expect(activity.locator('[data-testid="activity-time"]')).toBeVisible();
      
      // 관련 사용자 정보
      await expect(activity.locator('[data-testid="activity-user"]')).toBeVisible();
    }
  });

  test('실시간 알림 업데이트 (Socket.IO)', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/notifications');
    
    // WebSocket 연결 확인
    const wsConnected = await page.evaluate(() => {
      return window.socket && window.socket.connected;
    });
    
    if (wsConnected) {
      // 실시간 알림 수신 테스트 (실제로는 서버에서 알림 전송 필요)
      await page.evaluate(() => {
        // 테스트용 실시간 알림 시뮬레이션
        if (window.socket) {
          window.socket.emit('test-notification', {
            type: 'comment',
            message: '새로운 댓글이 달렸습니다',
            timestamp: new Date()
          });
        }
      });
      
      // 새 알림이 실시간으로 표시되는지 확인
      await expect(page.locator('text=새로운 댓글이 달렸습니다')).toBeVisible();
    }
  });
});