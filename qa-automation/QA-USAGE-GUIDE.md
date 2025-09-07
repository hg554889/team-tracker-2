# 🚀 Team Tracker v2 QA 자동화 완전 사용 가이드

## 📋 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [설치 및 초기 설정](#설치-및-초기-설정)
3. [테스트 실행 방법](#테스트-실행-방법)
4. [테스트 결과 분석](#테스트-결과-분석)
5. [커스터마이징](#커스터마이징)
6. [트러블슈팅](#트러블슈팅)
7. [CI/CD 통합](#cicd-통합)

---

## 🔧 시스템 요구사항

### **하드웨어**
- **RAM**: 최소 8GB (권장 16GB)
- **저장공간**: 최소 2GB 여유 공간
- **프로세서**: Intel i5 이상 또는 동급 AMD

### **소프트웨어**
- **Node.js**: v16.0.0 이상
- **npm**: v7.0.0 이상
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+

### **네트워크**
- 인터넷 연결 (브라우저 다운로드용)
- 로컬호스트 포트: 3000, 5000번 사용 가능

---

## 📦 설치 및 초기 설정

### **1단계: 프로젝트 클론 및 이동**
```bash
# 프로젝트 루트 디렉토리에서
cd qa-automation
```

### **2단계: 의존성 설치**
```bash
# Playwright와 모든 필수 패키지 설치
npm install

# 브라우저 엔진 다운로드 (약 400MB)
npx playwright install

# 시스템 종속성 설치 (Linux만 해당)
npx playwright install-deps
```

### **3단계: 환경 설정**
```bash
# 환경 파일 복사
cp .env.example .env

# .env 파일 내용 수정
TEST_ADMIN_EMAIL=qa-admin@test.com
TEST_ADMIN_PASSWORD=QAAdmin123!
# ... 기타 설정
```

### **4단계: 테스트 사용자 생성**
```bash
# 데이터베이스에 테스트 사용자 추가 (수동 또는 시드 스크립트)
# fixtures/testUsers.js에 정의된 사용자들을 실제 DB에 생성
```

---

## 🎯 테스트 실행 방법

### **기본 실행 명령어**

```bash
# 🔥 모든 테스트 실행 (헤드리스)
npm test

# 🖥️ 브라우저 UI 표시하며 실행
npm run test:headed

# 🐛 디버그 모드 (한 번에 하나씩 실행)
npm run test:debug

# 📊 인터랙티브 UI 모드
npm run test:ui

# 📱 모바일 테스트
npx playwright test --project=mobile-chrome
```

### **카테고리별 테스트**

```bash
# 🔐 인증 테스트만 실행
npm run test:auth

# 👥 권한 테스트만 실행
npm run test:roles

# 👫 팀 관리 테스트만 실행  
npm run test:teams

# 📝 보고서 테스트만 실행
npm run test:reports

# ⚙️ 관리자 기능 테스트
npx playwright test tests/admin/

# 🔔 알림 시스템 테스트
npx playwright test tests/notifications/
```

### **고급 실행 옵션**

```bash
# 특정 브라우저만
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# 병렬 실행 워커 수 조정
npx playwright test --workers=4

# 재시도 횟수 설정
npx playwright test --retries=2

# 특정 테스트 파일만
npx playwright test tests/auth/login.spec.js

# 테스트 이름으로 필터링
npx playwright test --grep "로그인 성공"

# 태그로 필터링 (예: @smoke)
npx playwright test --grep "@smoke"
```

---

## 📊 테스트 결과 분석

### **1. HTML 보고서**

```bash
# 테스트 실행 후 자동으로 생성됨
npm run report

# 또는 직접 열기
npx playwright show-report
```

**보고서 내용:**
- ✅ 성공/실패 테스트 개수
- ⏱️ 실행 시간 통계
- 🖼️ 실패 시 스크린샷
- 🎬 실행 과정 비디오 (실패 시)
- 📊 브라우저별 결과 비교

### **2. 터미널 출력 해석**

```bash
Running 47 tests using 4 workers

✅ tests/auth/login.spec.js:5:3 › 유효한 사용자 로그인 성공 (2.1s)
✅ tests/auth/login.spec.js:18:3 › 잘못된 이메일로 로그인 실패 (1.8s)
❌ tests/teams/team-management.spec.js:12:3 › 새 팀 생성 (3.2s)

  Error: expect(received).toBeVisible()
    at tests/teams/team-management.spec.js:25:5
```

**상태 표시:**
- ✅ **통과**: 테스트 성공
- ❌ **실패**: 테스트 실패 (에러 내용 표시)
- ⏭️ **건너뜀**: 조건부로 스킵된 테스트
- 🔄 **재시도**: 실패 후 재실행 중

### **3. 상세 디버깅 정보**

```bash
# 자세한 로그 출력
DEBUG=pw:api npx playwright test

# 네트워크 요청 추적
npx playwright test --trace=on

# 브라우저 콘솔 로그 표시
npx playwright test --reporter=list --verbose
```

---

## 🎨 커스터마이징

### **1. 새로운 테스트 추가**

```javascript
// tests/custom/example.spec.js
import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';

test.describe('커스텀 기능 테스트', () => {
  test('새로운 기능 테스트', async ({ page }) => {
    await loginAs(page, 'member');
    
    await page.goto('/custom-page');
    await expect(page.locator('h1')).toContainText('커스텀 페이지');
  });
});
```

### **2. 테스트 데이터 수정**

```javascript
// fixtures/testUsers.js 수정
export const testUsers = {
  customRole: {
    name: 'Custom User',
    email: 'custom@test.com', 
    password: 'Custom123!',
    role: 'CUSTOM_ROLE'
  }
};
```

### **3. 헬퍼 함수 확장**

```javascript
// utils/customHelpers.js
export async function createCustomData(page, data) {
  await page.goto('/custom/create');
  // 커스텀 로직 구현
}
```

### **4. 설정 조정**

```javascript
// playwright.config.js 수정
export default defineConfig({
  // 타임아웃 조정
  timeout: 60000, // 60초
  
  // 재시도 횟수
  retries: 3,
  
  // 새로운 프로젝트 추가
  projects: [
    {
      name: 'custom-tests',
      testDir: './tests/custom',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
```

---

## 🚨 트러블슈팅

### **일반적인 문제들**

#### **1. 포트 충돌 오류**
```bash
Error: Port 3000 is already in use
```
**해결방법:**
```bash
# 포트 사용 프로세스 확인
netstat -ano | findstr :3000  # Windows
lsof -i :3000                # Mac/Linux

# 프로세스 종료 후 재시도
kill -9 <PID>
```

#### **2. 브라우저 다운로드 실패**
```bash
Error: Download failed
```
**해결방법:**
```bash
# 브라우저 재다운로드
npx playwright install --force

# 방화벽/프록시 설정 확인
npm config set proxy http://proxy.company.com:8080
```

#### **3. 테스트 타임아웃**
```bash
Error: Test timeout of 30000ms exceeded
```
**해결방법:**
```javascript
// 개별 테스트 타임아웃 늘리기
test('느린 테스트', async ({ page }) => {
  test.setTimeout(60000); // 60초
  // 테스트 코드
});

// 전역 타임아웃 설정
// playwright.config.js에서 timeout: 60000 설정
```

#### **4. 요소 찾기 실패**
```bash
Error: Locator not found
```
**해결방법:**
```javascript
// 요소가 로드될 때까지 대기
await page.waitForSelector('[data-testid="element"]');

// 조건부 대기
await page.waitForLoadState('networkidle');

// 더 구체적인 선택자 사용
await page.locator('[data-testid="specific-element"]').click();
```

### **디버깅 팁**

```bash
# 1. 스크린샷 자동 캡처
npx playwright test --screenshot=on

# 2. 비디오 녹화 활성화
npx playwright test --video=on

# 3. 브라우저 개발자 도구 열기
npx playwright test --debug

# 4. 테스트 일시정지점 설정
await page.pause(); // 코드에 추가
```

---

## 🔄 CI/CD 통합

### **GitHub Actions 예시**

```yaml
# .github/workflows/qa-tests.yml
name: QA Automation Tests

on:
  push:
    branches: [main, qa-automation]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd qa-automation
        npm ci
        npx playwright install --with-deps
    
    - name: Start application servers
      run: |
        cd server && npm install && npm run dev &
        cd client && npm install && npm start &
        sleep 30
    
    - name: Run QA tests
      run: |
        cd qa-automation
        npm test
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: qa-automation/playwright-report/
```

### **Docker 컨테이너 실행**

```dockerfile
# Dockerfile.qa
FROM mcr.microsoft.com/playwright:v1.40.0

WORKDIR /app
COPY qa-automation/package*.json ./
RUN npm ci

COPY qa-automation/ ./
CMD ["npm", "test"]
```

```bash
# Docker로 실행
docker build -f Dockerfile.qa -t team-tracker-qa .
docker run --rm -v $(pwd)/qa-automation/test-results:/app/test-results team-tracker-qa
```

---

## 📈 성능 최적화

### **병렬 실행 최적화**
```bash
# CPU 코어 수에 맞춘 워커 설정
npx playwright test --workers=$(nproc)  # Linux
npx playwright test --workers=4         # 수동 설정
```

### **선택적 테스트 실행**
```javascript
// package.json에 스크립트 추가
{
  "scripts": {
    "test:smoke": "playwright test --grep '@smoke'",
    "test:critical": "playwright test tests/auth/ tests/roles/",
    "test:quick": "playwright test --workers=8 --retries=0"
  }
}
```

### **캐싱 활용**
```bash
# 브라우저 캐시 재사용
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/playwright
```

---

## 📞 지원 및 문의

- **이슈 리포팅**: GitHub Issues
- **문서**: `/qa-automation/README.md`
- **예시 테스트**: `/qa-automation/tests/` 폴더 참조

**Happy Testing! 🚀**