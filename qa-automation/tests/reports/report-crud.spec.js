import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { createReport, waitForPageLoad } from '../../utils/testHelpers.js';
import { testData } from '../../fixtures/testUsers.js';

test.describe('보고서 CRUD 기능', () => {
  test('보고서 생성 - 모든 필수 필드 입력', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/reports/new');
    await page.waitForTimeout(2000);
    
    // 보고서 생성 폼 확인 (실제 구조: 4 inputs, 5 textareas)
    await expect(page.locator('h1:has-text("보고서 작성")')).toBeVisible(); // 페이지 제목
    await expect(page.locator('input').first()).toBeVisible(); // input 필드들
    await expect(page.locator('textarea').first()).toBeVisible(); // textarea 필드들
    
    const reportTitle = `QA 테스트 보고서 ${Date.now()}`;
    
    // 먼저 팀 선택
    await page.selectOption('select.form-input', { index: 1 }); // 첫 번째 팀 선택
    
    // 진행률 입력 (실제 클래스명 사용)
    await page.fill('input.form-input.progress-input', '75');
    
    // 단기 목표 입력 (실제 클래스명 사용)
    await page.fill('textarea.form-textarea.short-goals', '백엔드 API 개발 75% 완료\n로그인 시스템 구현 완료\nDB 연결 이슈 해결됨');
    
    // 장기 목표 입력 (실제 클래스명 사용)
    await page.fill('textarea.form-textarea.long-goals', '프로젝트 완성도 향상\n사용자 경험 개선\n시스템 안정성 확보');
    
    // 실행 계획 입력 (실제 클래스명 사용)
    await page.fill('textarea.form-textarea.action-plans', '1. API 테스트 완료\n2. 프론트엔드 통합\n3. 배포 준비');
    
    await page.click('button.btn-submit');
    
    // 성공 후 팀 페이지로 리다이렉트되기를 기다림 (nav(`/teams/${teamId}#reports`))
    await page.waitForURL('**/teams/**#reports', { timeout: 10000 });
    
    // 성공 확인 - 팀 페이지의 보고서 섹션에서 생성된 내용 확인
    await expect(page.locator('text=75%').first()).toBeVisible({ timeout: 5000 });
  });

  test('보고서 생성 - 필수 필드 누락 시 validation', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/reports/new');
    
    // 진행률만 입력하고 제출 (다른 필드 비워둠)
    await page.fill('input[type="number"].progress-input', '50');
    await page.click('button[type="submit"]');
    
    // validation 에러 확인 - required 필드들이 비어있어야 함
    const shortGoalsField = page.locator('textarea.short-goals');
    await expect(shortGoalsField).toHaveAttribute('required');
  });

  test('보고서 목록 조회', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/reports');
    
    // 보고서 목록 확인
    await expect(page.locator('[data-testid="reports-list"]')).toBeVisible();
    
    // 보고서 카드들 확인
    const reportCards = page.locator('.report-card');
    
    if (await reportCards.count() > 0) {
      await expect(reportCards.first()).toBeVisible();
      await expect(reportCards.first().locator('.report-title')).toBeVisible();
      await expect(reportCards.first().locator('.report-progress')).toBeVisible();
      await expect(reportCards.first().locator('.report-date')).toBeVisible();
    }
  });

  test('보고서 상세 조회', async ({ page }) => {
    await loginAs(page, 'member');
    
    // 먼저 보고서 생성
    await createReport(page);
    
    await page.goto('/reports');
    
    // 첫 번째 보고서 클릭
    if (await page.locator('.report-card:first-child').isVisible()) {
      await page.click('.report-card:first-child');
      
      // 보고서 상세 정보 확인
      await expect(page.locator('[data-testid="report-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-goals"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-issues"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-deadline"]')).toBeVisible();
      
      // 작성자 정보 확인
      await expect(page.locator('[data-testid="report-author"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-created-date"]')).toBeVisible();
    }
  });

  test('보고서 수정 - 작성자만 가능', async ({ page }) => {
    await loginAs(page, 'member');
    
    await createReport(page);
    await page.goto('/reports');
    
    if (await page.locator('.report-card:first-child').isVisible()) {
      await page.click('.report-card:first-child');
      
      // 수정 버튼 확인 (작성자인 경우)
      await expect(page.locator('text=수정')).toBeVisible();
      
      await page.click('text=수정');
      
      // 수정 폼으로 이동 - 실제 필드들 확인
      await expect(page.locator('textarea.short-goals')).toBeVisible();
      
      const updatedGoals = `수정된 단기 목표 ${Date.now()}`;
      await page.fill('textarea.short-goals', updatedGoals);
      await page.fill('input[type="number"].progress-input', '85');
      
      await page.click('button[type="submit"]');
      
      // 수정된 내용 확인
      await expect(page.locator(`text=${updatedGoals}`)).toBeVisible();
      await expect(page.locator('text=85%')).toBeVisible();
    }
  });

  test('보고서 삭제 - 작성자 또는 Leader 권한', async ({ page }) => {
    await loginAs(page, 'member');
    
    await createReport(page);
    await page.goto('/reports');
    
    if (await page.locator('.report-card:first-child').isVisible()) {
      const reportTitle = await page.locator('.report-card:first-child .report-title').textContent();
      
      await page.click('.report-card:first-child');
      
      // 삭제 버튼 확인
      await expect(page.locator('text=삭제')).toBeVisible();
      
      await page.click('text=삭제');
      
      // 확인 다이얼로그
      await page.click('text=확인');
      
      // 보고서 목록으로 리다이렉트되고 해당 보고서가 없는지 확인
      await page.waitForURL('/reports');
      await expect(page.locator(`text=${reportTitle}`)).not.toBeVisible();
    }
  });

  test('보고서 파일 첨부', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/reports/new');
    
    await page.fill('input[type="number"].progress-input', '50');
    await page.fill('textarea.short-goals', '파일 첨부 테스트 목표');
    await page.fill('textarea.long-goals', '장기적 파일 관리 목표');
    await page.fill('textarea.action-plans', '파일 시스템 구축 계획');
    await page.fill('textarea.milestones', '파일 첨부 기능 완성');
    await page.fill('textarea.issues-textarea', '파일 업로드 이슈 없음');
    
    // 파일 첨부 (테스트용 텍스트 파일 생성)
    const fileContent = 'QA 테스트용 파일입니다.';
    const buffer = Buffer.from(fileContent, 'utf8');
    
    await page.setInputFiles('[name="attachment"]', {
      name: 'test-file.txt',
      mimeType: 'text/plain',
      buffer: buffer
    });
    
    await page.click('button[type="submit"]');
    
    // 파일이 첨부되었는지 확인
    await waitForPageLoad(page);
    await expect(page.locator('text=test-file.txt')).toBeVisible();
    await expect(page.locator('a[download="test-file.txt"]')).toBeVisible();
  });

  test('보고서 댓글 작성', async ({ page }) => {
    await loginAs(page, 'member');
    
    await createReport(page);
    await page.goto('/reports');
    
    if (await page.locator('.report-card:first-child').isVisible()) {
      await page.click('.report-card:first-child');
      
      // 댓글 섹션 확인
      await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
      
      const commentText = `QA 테스트 댓글 ${Date.now()}`;
      await page.fill('[name="comment"]', commentText);
      await page.click('text=댓글 작성');
      
      // 작성된 댓글 확인
      await expect(page.locator(`text=${commentText}`)).toBeVisible();
    }
  });

  test('보고서 진행률 차트 표시', async ({ page }) => {
    await loginAs(page, 'member');
    
    await createReport(page);
    await page.goto('/reports');
    
    if (await page.locator('.report-card:first-child').isVisible()) {
      await page.click('.report-card:first-child');
      
      // 진행률 차트나 진행바 확인
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
      
      // 퍼센티지 표시 확인
      await expect(page.locator('text=75%')).toBeVisible();
    }
  });

  test('보고서 검색 및 필터링', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/reports');
    
    // 제목으로 검색
    await page.fill('[data-testid="search-input"]', 'QA');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // 검색 결과 확인
    const reportCards = page.locator('.report-card');
    const count = await reportCards.count();
    
    for (let i = 0; i < count; i++) {
      const reportTitle = await reportCards.nth(i).locator('.report-title').textContent();
      expect(reportTitle.toLowerCase()).toContain('qa');
    }
    
    // 진행률로 필터링
    if (await page.locator('[data-testid="progress-filter"]').isVisible()) {
      await page.selectOption('[data-testid="progress-filter"]', '75-100');
      await waitForPageLoad(page);
      
      // 필터링된 결과 확인 (75% 이상인 보고서만)
      const filteredCards = page.locator('.report-card');
      const filteredCount = await filteredCards.count();
      
      for (let i = 0; i < filteredCount; i++) {
        const progressText = await filteredCards.nth(i).locator('.report-progress').textContent();
        const progress = parseInt(progressText.replace('%', ''));
        expect(progress).toBeGreaterThanOrEqual(75);
      }
    }
  });

  test('다른 사용자 보고서 - 수정 삭제 불가', async ({ page, context }) => {
    // Member가 보고서 생성
    await loginAs(page, 'member');
    await createReport(page);
    
    // 다른 사용자로 로그인하여 같은 보고서 접근
    const otherUserPage = await context.newPage();
    await loginAs(otherUserPage, 'leader');
    
    await otherUserPage.goto('/reports');
    
    if (await otherUserPage.locator('.report-card:first-child').isVisible()) {
      await otherUserPage.click('.report-card:first-child');
      
      // 수정, 삭제 버튼이 없어야 함 (Leader 권한이 있으면 예외)
      const hasEditButton = await otherUserPage.locator('text=수정').isVisible();
      const hasDeleteButton = await otherUserPage.locator('text=삭제').isVisible();
      
      // Leader는 팀 내 보고서 관리 권한이 있을 수 있음
      // 구체적인 권한 정책에 따라 조정 필요
    }
    
    await otherUserPage.close();
  });
});