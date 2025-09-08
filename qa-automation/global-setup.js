import { chromium } from '@playwright/test';
import { testUsers } from './fixtures/testUsers.js';

async function globalSetup() {
  console.log('🔧 Starting global authentication setup...');
  
  const browser = await chromium.launch();
  
  // 각 역할별로 인증 상태 생성
  const roles = ['admin', 'executive', 'leader', 'member'];
  
  for (const role of roles) {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log(`🔑 Authenticating as ${role}...`);
      
      const user = testUsers[role];
      if (!user) {
        console.log(`⚠️  No test user found for role: ${role}`);
        continue;
      }
      
      // API로 직접 로그인하여 토큰 획득
      const response = await page.request.post('http://localhost:5001/api/auth/login', {
        data: {
          email: user.email,
          password: user.password
        }
      });
      
      if (!response.ok()) {
        console.log(`❌ Login failed for ${role}: ${response.status()}`);
        continue;
      }
      
      const data = await response.json();
      const token = data.token;
      const userData = data.user;
      
      console.log(`✅ Got token for ${role}, user status: ${userData.approvalStatus}`);
      
      // 브라우저에서 localStorage에 토큰 설정 (실제 앱과 동일한 방식)
      await page.goto('http://localhost:3000');
      
      await page.evaluate(({ token, userData }) => {
        localStorage.setItem('token', token);
        // AuthContext가 사용할 수 있도록 사용자 데이터도 저장
        localStorage.setItem('user', JSON.stringify(userData));
      }, { token, userData });
      
      // AuthContext가 로딩될 시간 대기
      await page.waitForTimeout(1000);
      
      // 인증 상태 저장
      await page.context().storageState({ 
        path: `.auth/${role}.json` 
      });
      
      console.log(`💾 Saved auth state for ${role}`);
      
    } catch (error) {
      console.log(`❌ Failed to authenticate ${role}:`, error.message);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
  console.log('✅ Global authentication setup completed');
}

export default globalSetup;