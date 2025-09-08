/**
 * 테스트용 JWT 토큰 생성 및 관리 헬퍼
 */

/**
 * 유효한 JWT 토큰을 브라우저에 설정
 * @param {import('@playwright/test').Page} page 
 * @param {string} userType - 'admin', 'executive', 'leader', 'member'
 */
export async function setValidToken(page, userType = 'member') {
  // 실제 로그인으로 유효한 토큰 얻기
  const { testUsers } = await import('../fixtures/testUsers.js');
  const user = testUsers[userType];
  
  // API 직접 호출로 토큰 획득
  const response = await page.request.post(`${process.env.API_BASE_URL || 'http://localhost:5000/api'}/auth/login`, {
    data: {
      email: user.email,
      password: user.password
    }
  });
  
  if (response.ok()) {
    const data = await response.json();
    const token = data.token;
    
    // 브라우저에 토큰 설정
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    return token;
  } else {
    throw new Error(`Failed to get valid token for ${userType}: ${response.status()}`);
  }
}

/**
 * 만료된 JWT 토큰 생성
 */
export function createExpiredToken() {
  // 간단한 만료된 토큰 (실제로는 서버에서 거부됨)
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImV4cCI6MTYwMDAwMDAwMH0.expired';
}

/**
 * 잘못된 형식의 토큰 생성
 */
export function createInvalidToken() {
  return 'invalid-jwt-token-format';
}

/**
 * 토큰 정리
 * @param {import('@playwright/test').Page} page 
 */
export async function clearTokens(page) {
  try {
    // 페이지가 로드되지 않은 상태라면 먼저 페이지로 이동
    if (page.url() === 'about:blank' || !page.url().startsWith('http')) {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    }
    
    await page.evaluate(() => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
      } catch (e) {
        // localStorage 접근 불가시 무시
      }
    });
  } catch (error) {
    console.log('Failed to clear tokens:', error.message);
  }
}