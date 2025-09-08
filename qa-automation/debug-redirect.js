import { chromium } from '@playwright/test';

async function debugRedirect() {
  console.log('🔍 리다이렉트 테스트 디버깅 시작');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ 
    storageState: '.auth/member.json'
  });
  const page = await context.newPage();
  
  try {
    // 1단계: 홈페이지 이동
    console.log('1️⃣ 홈페이지로 이동...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    // 토큰 확인
    const hasToken = await page.evaluate(() => localStorage.getItem('token') !== null);
    console.log('토큰 존재:', hasToken);
    
    if (!hasToken) {
      // 수동으로 토큰 설정
      console.log('2️⃣ 토큰 수동 설정...');
      await page.evaluate(() => {
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTFkNTYxMWVkZWM1MjliNzY3YTlkZCIsInJvbGUiOiJNRU1CRVIiLCJjbHViSWQiOiJBdW5hZSIsImlhdCI6MTc1NzMzODc2MSwiZXhwIjoxNzU3OTQzNTYxfQ.IcfJx8G6lXb0tkPZSQP9gDSRt7_ohqILkyXF4liEjLE');
        localStorage.setItem('user', '{"_id":"68a1d5611edec529b767a9dd","email":"member@gmail.com","username":"test_member","studentId":"202404055","role":"MEMBER","clubId":"Aunae","isApproved":true,"approvalStatus":"approved"}');
      });
      await page.reload();
      await page.waitForTimeout(2000);
    }
    
    // 현재 URL 확인
    console.log('현재 URL:', page.url());
    
    // 3단계: 로그인 페이지로 이동 시도
    console.log('3️⃣ 로그인 페이지로 이동 시도...');
    await page.goto('http://localhost:3000/login');
    console.log('로그인 페이지 이동 후 URL:', page.url());
    
    // 5초 대기하여 리다이렉트 확인
    await page.waitForTimeout(5000);
    const finalUrl = page.url();
    console.log('최종 URL:', finalUrl);
    
    // 리다이렉트 되었는지 확인
    const isRedirected = !finalUrl.includes('/login');
    console.log('리다이렉트 됨:', isRedirected);
    
    // 화면 스크린샷
    await page.screenshot({ path: 'redirect-debug.png' });
    console.log('스크린샷 저장됨: redirect-debug.png');
    
  } catch (error) {
    console.error('에러 발생:', error.message);
  } finally {
    await browser.close();
  }
}

debugRedirect();