# Team Tracker QA Test Suite

Team Tracker v2의 포괄적인 E2E 테스트 스위트입니다. Playwright와 Claude Code를 활용한 자연어 시나리오 기반 테스트 자동화를 구현했습니다.

## 📁 디렉토리 구조

```
qa-test/
├── README.md                 # 이 파일
├── helpers/                  # 테스트 헬퍼 함수
│   ├── auth-helper.js        # 인증 관련 헬퍼
│   └── navigation-helper.js  # 네비게이션 헬퍼
├── fixtures/                 # 테스트 데이터 및 픽스처
│   └── test-data.js          # 통합 테스트 데이터
├── auth/                     # 인증 관련 테스트
│   └── login.spec.js         # 로그인/로그아웃 테스트
├── teams/                    # 팀 관리 테스트
│   └── team-management.spec.js # 팀 CRUD 및 멤버 관리 테스트
├── reports/                  # 보고서 관리 테스트 (예정)
├── admin/                    # 관리자 기능 테스트 (예정)
└── dashboard/               # 대시보드 테스트 (예정)
```

## 🚀 빠른 시작

### 테스트 실행
```bash
# 전체 QA 테스트 실행
npm run test:e2e

# 브라우저 헤드 모드로 실행 (화면 보기)
npm run test:e2e:headed

# 인터랙티브 UI 모드
npm run test:e2e:ui

# 특정 카테고리별 실행
npm run test:auth      # 인증 테스트만
npm run test:teams     # 팀 관리 테스트만
npm run test:reports   # 보고서 테스트만
npm run test:admin     # 관리자 테스트만

# 스모크 테스트만 실행
npm run test:smoke
```

### 개별 테스트 파일 실행
```bash
# 특정 테스트 파일 실행
npx playwright test qa-test/auth/login.spec.js

# 헤드 모드로 특정 테스트 실행
npx playwright test qa-test/auth/login.spec.js --headed

# 특정 테스트 케이스만 실행
npx playwright test qa-test/auth/login.spec.js -g "관리자 로그인 성공"
```

## 📋 구현된 테스트

### ✅ 인증 테스트 (auth/login.spec.js)
- **관리자 로그인 성공** - 관리자 권한 확인 및 메뉴 표시
- **리더 로그인 성공** - 리더 권한 확인 및 기능 접근
- **멤버 로그인 성공** - 멤버 권한 제한 확인
- **잘못된 비밀번호로 로그인 실패** - 에러 메시지 표시
- **존재하지 않는 이메일로 로그인 실패** - 사용자 없음 에러
- **빈 필드로 로그인 시도** - 폼 검증 에러
- **이미 로그인된 사용자 페이지 접근** - 자동 리다이렉트
- **로그아웃 후 보호된 페이지 접근** - 접근 차단
- **세션 만료 후 자동 로그아웃** - 토큰 만료 처리
- **Remember Me 기능** - 로그인 상태 지속성

### ✅ 팀 관리 테스트 (teams/team-management.spec.js)
- **리더가 새 팀을 생성한다** - 팀 생성 프로세스 전체
- **멤버가 팀 생성 시도 시 권한 오류** - 권한 제어 확인
- **팀 리더가 팀 정보를 수정한다** - 팀 정보 업데이트
- **팀 초대 링크 생성 및 사용** - 초대 시스템 테스트
- **팀 멤버 권한 변경** - 멤버 → 리더 권한 변경
- **팀 멤버 제거** - 팀에서 멤버 제거
- **팀 삭제** - 팀 완전 삭제 프로세스
- **팀 검색 및 필터링** - 검색/필터 기능
- **Executive 소속 동아리 팀만 조회** - 권한별 데이터 필터링

### 🔄 예정된 테스트
- **보고서 관리 테스트** - 보고서 CRUD, 댓글, 첨부파일
- **관리자 기능 테스트** - 사용자/동아리 관리, 승인 시스템
- **대시보드 테스트** - 역할별 대시보드 위젯

## 🛠 헬퍼 함수 가이드

### auth-helper.js
인증 관련 모든 작업을 단순화하는 헬퍼 함수들:

```javascript
import { loginAs, logout, expectToBeLoggedIn } from '../helpers/auth-helper.js';

// 역할별 로그인
await loginAs(page, 'admin');    // 관리자로 로그인
await loginAs(page, 'leader');   // 리더로 로그인
await loginAs(page, 'member');   // 멤버로 로그인

// 로그아웃
await logout(page);

// 로그인 상태 확인
await expectToBeLoggedIn(page, 'ADMIN');

// 로그인 에러 확인
await expectLoginError(page, '로그인 정보가 올바르지 않습니다');
```

**사용 가능한 사용자 역할:**
- `admin` - 전체 시스템 관리 권한
- `executive` - 동아리별 관리 권한
- `leader` - 팀 관리 권한
- `member` - 기본 사용자 권한

### navigation-helper.js
페이지 이동 및 UI 상호작용 헬퍼 함수들:

```javascript
import { navigateTo, waitForElement, openModal } from '../helpers/navigation-helper.js';

// 페이지 이동
await navigateTo(page, '/teams');

// 요소 대기
await waitForElement(page, '[data-testid="create-btn"]');

// 모달 열기
await openModal(page, '[data-testid="create-btn"]', '.modal');

// API 응답 대기
await waitForApiResponse(page, '/api/teams', 'POST');
```

## 📊 테스트 데이터 관리

### test-data.js
모든 테스트에서 사용하는 통합 데이터 관리:

```javascript
import { testData, generateTestData } from '../fixtures/test-data.js';

// 정적 테스트 데이터
const adminUser = testData.users.admin;
const teamData = testData.teams.development;

// 동적 테스트 데이터 (각 테스트마다 고유)
const dynamicData = generateTestData();
const uniqueTeam = dynamicData.teams.development; // 타임스탬프 포함
```

**주요 데이터 카테고리:**
- `users` - 역할별 테스트 사용자
- `teams` - 팀 생성용 테스트 데이터
- `reports` - 보고서 테스트 데이터
- `selectors` - UI 셀렉터 상수
- `api` - API 엔드포인트 상수
- `errors` - 에러 메시지 상수
- `success` - 성공 메시지 상수

## 🎯 테스트 작성 가이드

### 기본 테스트 구조
```javascript
import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from '../helpers/auth-helper.js';
import { navigateTo, waitForElement } from '../helpers/navigation-helper.js';
import { testData } from '../fixtures/test-data.js';

test.describe('기능명 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 초기화
    await clearAuth(page);
  });

  test('테스트 시나리오명', async ({ page }) => {
    // Given: 초기 상태 설정
    await loginAs(page, 'admin');

    // When: 사용자 동작
    await navigateTo(page, '/teams');
    await page.click(testData.selectors.teams.createButton);

    // Then: 결과 검증
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### 모범 사례

#### 1. 데이터 기반 테스트
```javascript
// 하드코딩 (피해야 할 방식)
await page.fill('input[name="email"]', 'admin@test.com');

// 데이터 기반 (권장 방식)
await page.fill(testData.selectors.auth.emailInput, testData.users.admin.email);
```

#### 2. 적절한 대기 조건
```javascript
// API 응답과 함께 동작 수행
const [response] = await Promise.all([
  waitForApiResponse(page, testData.api.teams.create, 'POST'),
  page.click(testData.selectors.teams.saveButton)
]);

expect(response.status()).toBe(201);
```

#### 3. 명확한 검증
```javascript
// 구체적인 검증
await expect(page.locator('.team-card')).toContainText(teamData.name);
await expect(page).toHaveURL('/teams');

// 상태 확인
await expectToBeLoggedIn(page, 'LEADER');
```

## 🔧 디버깅 가이드

### 일반적인 문제 해결

#### 1. 요소를 찾을 수 없음
```javascript
// data-testid 사용 (권장)
await page.click('[data-testid="create-btn"]');

// CSS 클래스 (대안)
await page.click('.create-button');

// 텍스트 기반 (최후)
await page.click('text="생성"');
```

#### 2. 타임아웃 에러
```javascript
// 명시적 대기 시간 설정
await expect(page.locator('.slow-element')).toBeVisible({ timeout: 10000 });

// API 응답 대기
await waitForApiResponse(page, '/api/slow-endpoint');

// 네트워크 안정화 대기
await page.waitForLoadState('networkidle');
```

#### 3. 불안정한 테스트
```javascript
// 동적 데이터 사용
const dynamicData = generateTestData();
const uniqueName = `팀명-${dynamicData.timestamp}`;

// 요소 상태 확인 후 동작
await waitForElement(page, '[data-testid="button"]');
await page.click('[data-testid="button"]');
```

### 디버깅 도구 활용

#### 1. 스크린샷 촬영
```javascript
// 테스트 실패 시 스크린샷
await page.screenshot({ path: 'debug-screenshot.png' });

// 특정 요소만 스크린샷
await page.locator('.modal').screenshot({ path: 'modal.png' });
```

#### 2. 페이지 상태 확인
```javascript
// 현재 URL 확인
console.log('Current URL:', page.url());

// localStorage 확인
const token = await page.evaluate(() => localStorage.getItem('token'));
console.log('Token:', token);

// 페이지 콘텐츠 확인
const content = await page.content();
console.log('Page content:', content);
```

#### 3. 네트워크 요청 모니터링
```javascript
// 모든 네트워크 요청 로깅
page.on('request', request => console.log('Request:', request.url()));
page.on('response', response => console.log('Response:', response.url(), response.status()));
```

## 📈 성능 최적화

### 테스트 실행 속도 향상
1. **병렬 실행**: 여러 브라우저에서 동시 실행
2. **헤드리스 모드**: 기본적으로 헤드리스 모드 사용
3. **선택적 실행**: 변경된 부분 관련 테스트만 실행
4. **데이터 재사용**: 테스트 간 공통 데이터 재사용

### 메모리 관리
```javascript
test.afterEach(async ({ page }) => {
  // 테스트 후 정리
  await clearAuth(page);

  // 불필요한 리소스 정리
  await page.close();
});
```

## 🚨 문제 신고 및 기여

### 테스트 실패 신고
테스트가 실패하면 다음 정보를 포함하여 신고해주세요:
1. 실패한 테스트 이름
2. 에러 메시지
3. 실행 환경 (OS, 브라우저)
4. 재현 단계

### 새로운 테스트 추가
1. `../test-scenarios/` 에서 자연어 시나리오 작성
2. Claude Code로 테스트 코드 생성
3. 헬퍼 함수 및 테스트 데이터 업데이트
4. 문서 업데이트

## 📝 관련 문서

- **전체 프로젝트 가이드**: `../README-TESTING.md`
- **시나리오 작성법**: `../test-scenarios/templates/scenario-template.md`
- **Claude Code 연동**: `../.claude/prompts/test-generator.md`
- **MCP 설정**: `../.vscode/mcp.json`

---

**📞 지원**: 문제가 있으면 GitHub Issues에 신고하거나 qa-automation 브랜치를 확인하세요.