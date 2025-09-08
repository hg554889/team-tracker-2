import { chromium } from '@playwright/test';

async function debugAdminPage() {
  console.log('🔍 Admin 페이지 디버깅 시작');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ 
    storageState: '.auth/admin.json'
  });
  const page = await context.newPage();
  
  try {
    // Admin 페이지로 이동
    console.log('📍 Admin users 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(5000);
    
    // 페이지 구조 확인
    console.log('🔍 페이지 구조 분석...');
    const title = await page.title();
    console.log('페이지 제목:', title);
    
    // 테이블 찾기
    const tables = await page.locator('table').count();
    console.log('발견된 테이블 개수:', tables);
    
    if (tables > 0) {
      // 첫 번째 테이블의 헤더 확인
      const headers = await page.locator('table th').allTextContents();
      console.log('테이블 헤더들:', headers);
      
      // 테이블에 data-testid가 있는지 확인
      const hasTestId = await page.locator('table[data-testid]').count();
      console.log('data-testid가 있는 테이블:', hasTestId);
      
      // 테이블의 클래스나 ID 확인
      const tableAttrs = await page.locator('table').first().evaluate(el => ({
        className: el.className,
        id: el.id,
        attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
      }));
      console.log('첫 번째 테이블 속성:', tableAttrs);
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'admin-debug.png' });
    console.log('스크린샷 저장됨: admin-debug.png');
    
  } catch (error) {
    console.error('에러 발생:', error.message);
  } finally {
    await browser.close();
  }
}

debugAdminPage();