import { testData } from '../fixtures/testUsers.js';

/**
 * 페이지 로딩 대기
 * @param {import('@playwright/test').Page} page
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
}

/**
 * 폼 제출 후 성공 메시지 확인
 * @param {import('@playwright/test').Page} page
 * @param {string} successMessage
 */
export async function expectSuccessMessage(page, successMessage) {
  await page.waitForSelector('[data-testid="toast"]', { state: 'visible' });
  const toast = page.locator('[data-testid="toast"]');
  await expect(toast).toContainText(successMessage);
}

/**
 * 에러 메시지 확인
 * @param {import('@playwright/test').Page} page
 * @param {string} errorMessage
 */
export async function expectErrorMessage(page, errorMessage) {
  await page.waitForSelector('[data-testid="error"]', { state: 'visible' });
  const errorElement = page.locator('[data-testid="error"]');
  await expect(errorElement).toContainText(errorMessage);
}

/**
 * 팀 생성 헬퍼 함수
 * @param {import('@playwright/test').Page} page
 * @param {Object} teamData
 */
export async function createTeam(page, teamData = testData.team) {
  await page.goto('/teams');
  await page.click('text=새 팀 만들기');
  await page.fill('[name="name"]', teamData.name);
  await page.fill('[name="description"]', teamData.description);
  await page.click('button[type="submit"]');
  await waitForPageLoad(page);
}

/**
 * 보고서 생성 헬퍼 함수
 * @param {import('@playwright/test').Page} page
 * @param {Object} reportData
 */
export async function createReport(page, reportData = testData.report) {
  await page.goto('/reports/new');
  await page.fill('[name="title"]', reportData.title);
  await page.fill('[name="progress"]', reportData.progress.toString());
  await page.fill('[name="goals"]', reportData.goals);
  await page.fill('[name="issues"]', reportData.issues);
  await page.fill('[name="deadline"]', reportData.deadline);
  await page.click('button[type="submit"]');
  await waitForPageLoad(page);
}

/**
 * 네트워크 응답 모킹
 * @param {import('@playwright/test').Page} page
 * @param {string} url
 * @param {Object} mockResponse
 */
export async function mockApiResponse(page, url, mockResponse) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });
}

/**
 * 현재 URL 경로 확인
 * @param {import('@playwright/test').Page} page
 * @returns {string}
 */
export async function getCurrentPath(page) {
  const url = new URL(page.url());
  return url.pathname;
}