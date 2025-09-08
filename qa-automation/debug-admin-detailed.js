import { chromium } from '@playwright/test';

async function debugAdminDetailed() {
  console.log('🔍 Admin 페이지 상세 디버깅');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ 
    storageState: '.auth/admin.json'
  });
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(3000);
    
    // 테이블 행 확인
    const rows = await page.locator('tbody tr').count();
    console.log('테이블 행 개수:', rows);
    
    if (rows > 0) {
      // 첫 번째 행의 모든 요소 확인
      const firstRow = page.locator('tbody tr:first-child');
      const cells = await firstRow.locator('td').count();
      console.log('첫 번째 행의 셀 개수:', cells);
      
      // 각 셀의 내용 확인
      for (let i = 0; i < cells; i++) {
        const cellContent = await firstRow.locator(`td:nth-child(${i + 1})`).innerHTML();
        console.log(`셀 ${i + 1}:`, cellContent.slice(0, 100)); // 처음 100자만 표시
      }
      
      // 드롭다운이나 버튼 찾기
      const dropdowns = await firstRow.locator('select').count();
      const buttons = await firstRow.locator('button').count();
      console.log('첫 번째 행 - 드롭다운:', dropdowns, '버튼:', buttons);
      
      if (dropdowns > 0) {
        const dropdownOptions = await firstRow.locator('select option').allTextContents();
        console.log('드롭다운 옵션들:', dropdownOptions);
      }
      
      if (buttons > 0) {
        const buttonTexts = await firstRow.locator('button').allTextContents();
        console.log('버튼 텍스트들:', buttonTexts);
      }
    }
    
    await page.screenshot({ path: 'admin-detailed.png' });
    
  } catch (error) {
    console.error('에러:', error.message);
  } finally {
    await browser.close();
  }
}

debugAdminDetailed();