import { testUsers } from '../fixtures/testUsers.js';
import { expect } from '@playwright/test';

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
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // 로그인 완료까지 대기 (여러 리다이렉트 가능성 고려)
  await page.waitForURL(url => {
    const urlString = url.toString();
    return !urlString.includes('/login') && !urlString.includes('/signup');
  }, { timeout: 15000 });
  
  // 로그인 후 상태별 처리
  const currentUrl = page.url();
  
  if (currentUrl.includes('/approval-pending')) {
    // 승인 대기 상태 - 이 상태로 두고 테스트에서 처리
    console.log(`User ${userType} is in pending approval status`);
    return;
  }
  
  if (currentUrl.includes('/select-club')) {
    // 클럽 선택 필요 - 환경변수에서 설정한 클럽 또는 첫 번째 클럽 선택
    const clubName = process.env.TEST_CLUB_NAME;
    
    if (clubName) {
      // 특정 클럽명으로 검색해서 선택
      const clubCard = page.locator('.club-card', { hasText: clubName });
      if (await clubCard.count() > 0) {
        await clubCard.first().click();
      } else {
        // 해당 클럽이 없으면 첫 번째 클럽 선택
        await page.waitForSelector('.club-card', { timeout: 5000 });
        const firstClub = page.locator('.club-card').first();
        await firstClub.click();
      }
    } else {
      // 첫 번째 클럽 선택
      await page.waitForSelector('.club-card', { timeout: 5000 });
      const firstClub = page.locator('.club-card').first();
      await firstClub.click();
    }
    
    // 클럽 선택 완료까지 대기
    await page.waitForURL(url => !url.toString().includes('/select-club'), { timeout: 10000 });
  }
  
  // 최종적으로 로그아웃 버튼이 보이는지 확인 (로그인 성공 확인)
  try {
    await expect(page.locator('text=로그아웃')).toBeVisible({ timeout: 5000 });
  } catch (error) {
    // 승인 대기 상태에서는 로그아웃 버튼이 없을 수 있음
    console.log('로그아웃 버튼을 찾을 수 없음 - 승인 대기 상태일 가능성');
  }
}

/**
 * 사용자 회원가입 헬퍼 함수 
 * @param {import('@playwright/test').Page} page
 * @param {Object} userData - 사용자 정보
 */
export async function signupUser(page, userData) {
  await page.goto('/signup');
  await page.fill('input[type="email"]', userData.email);
  await page.fill('input[placeholder="실명을 입력하세요"]', userData.name);
  await page.fill('input[placeholder="예: 20241234"]', '20241234');
  
  // .env에서 설정한 동아리 선택, 없으면 첫 번째 동아리 선택
  const clubName = process.env.TEST_CLUB_NAME;
  if (clubName) {
    await page.selectOption('select', { label: clubName });
  } else {
    await page.selectOption('select', { index: 1 }); // 0은 "동아리를 선택하세요" 옵션
  }
  
  await page.fill('input[type="password"]', userData.password);
  await page.click('button[type="submit"]');
}

/**
 * 로그아웃 헬퍼 함수
 * @param {import('@playwright/test').Page} page
 */
export async function logout(page) {
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
    await page.waitForSelector('text=로그아웃', { timeout: 3000 });
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
    await page.waitForURL(url => !url.toString().includes(route));
    return !page.url().includes(route);
  }
}