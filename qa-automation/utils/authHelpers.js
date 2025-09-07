import { testUsers } from '../fixtures/testUsers.js';

/**
 * 사용자 로그인 헬퍼 함수
 * @param {import('@playwright/test').Page} page 
 * @param {string} userType - 'admin', 'executive', 'leader', 'member'
 */
export async function loginAs(page, userType) {
  const user = testUsers[userType];
  if (!user) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  await page.goto('/login');
  await page.fill('[name="email"]', user.email);
  await page.fill('[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // 로그인 완료까지 대기
  await page.waitForURL(url => !url.includes('/login'));
}

/**
 * 사용자 회원가입 헬퍼 함수 
 * @param {import('@playwright/test').Page} page
 * @param {Object} userData - 사용자 정보
 */
export async function signupUser(page, userData) {
  await page.goto('/signup');
  await page.fill('[name="name"]', userData.name);
  await page.fill('[name="email"]', userData.email);
  await page.fill('[name="password"]', userData.password);
  await page.click('button[type="submit"]');
}

/**
 * 로그아웃 헬퍼 함수
 * @param {import('@playwright/test').Page} page
 */
export async function logout(page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=로그아웃');
  await page.waitForURL('/login');
}

/**
 * 인증 상태 확인
 * @param {import('@playwright/test').Page} page
 * @returns {boolean}
 */
export async function isLoggedIn(page) {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 특정 역할의 접근 권한 확인
 * @param {import('@playwright/test').Page} page
 * @param {string} route - 확인할 라우트
 * @param {boolean} shouldHaveAccess - 접근 가능해야 하는지 여부
 */
export async function checkAccess(page, route, shouldHaveAccess = true) {
  await page.goto(route);
  
  if (shouldHaveAccess) {
    // 접근이 허용되어야 하는 경우 - 해당 페이지 컨텐츠 확인
    await page.waitForLoadState('networkidle');
    return page.url().includes(route);
  } else {
    // 접근이 거부되어야 하는 경우 - 리다이렉트 확인
    await page.waitForURL(url => !url.includes(route));
    return !page.url().includes(route);
  }
}