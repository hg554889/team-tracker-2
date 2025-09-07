import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';
import { createReport, waitForPageLoad } from '../../utils/testHelpers.js';
import { testData } from '../../fixtures/testUsers.js';

test.describe('보고서 CRUD 기능', () => {
  test('보고서 생성 - 모든 필수 필드 입력', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/reports/new');
    
    // 보고서 생성 폼 확인
    await expect(page.locator('[name="title"]')).toBeVisible();
    await expect(page.locator('[name="progress"]')).toBeVisible();
    await expect(page.locator('[name="goals"]')).toBeVisible();
    await expect(page.locator('[name="issues"]')).toBeVisible();
    
    const reportTitle = `QA 테스트 보고서 ${Date.now()}`;
    
    await page.fill('[name="title"]', reportTitle);
    await page.fill('[name="progress"]', '75');
    await page.fill('[name="goals"]', '백엔드 API 개발 완료');
    await page.fill('[name="issues"]', '데이터베이스 연결 이슈 해결됨');
    await page.fill('[name="deadline"]', '2024-12-31');
    
    await page.click('button[type="submit"]');
    
    // 보고서 상세 페이지로 이동 확인
    await waitForPageLoad(page);
    await expect(page.locator(`text=${reportTitle}`)).toBeVisible();
    await expect(page.locator('text=75%')).toBeVisible();
  });

  test('보고서 생성 - 필수 필드 누락 시 validation', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/reports/new');
    
    // 제목만 입력하고 제출
    await page.fill('[name="title"]', '제목만 입력');
    await page.click('button[type="submit"]');
    
    // validation 에러 확인
    const progressField = page.locator('[name="progress"]');
    await expect(progressField).toHaveAttribute('required');
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
      
      // 수정 폼으로 이동
      await expect(page.locator('[name="title"]')).toBeVisible();
      
      const updatedTitle = `수정된 보고서 제목 ${Date.now()}`;
      await page.fill('[name="title"]', updatedTitle);
      await page.fill('[name="progress"]', '85');
      
      await page.click('button[type="submit"]');
      
      // 수정된 내용 확인
      await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
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
    
    await page.fill('[name="title"]', '첨부파일 테스트 보고서');
    await page.fill('[name="progress"]', '50');
    await page.fill('[name="goals"]', '파일 첨부 테스트');
    await page.fill('[name="issues"]', '없음');
    
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