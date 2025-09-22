# Team Tracker v2 - 테스트 자동화 가이드

## 🎯 개요

Team Tracker v2는 자연어 테스트 시나리오 기반의 Playwright E2E 테스트 자동화를 구현했습니다.
Claude Code와 MCP(Model Context Protocol)를 활용하여 시나리오에서 테스트 코드를 자동 생성합니다.

## 📁 프로젝트 구조

```
team-tracker-ver2/
├── test-scenarios/           # 자연어 테스트 시나리오
│   ├── templates/           # 시나리오 템플릿
│   ├── auth/               # 인증 관련 시나리오
│   ├── teams/              # 팀 관리 시나리오
│   ├── reports/            # 보고서 관리 시나리오
│   ├── admin/              # 관리자 기능 시나리오
│   └── dashboard/          # 대시보드 시나리오
├── qa-test/                # 생성된 Playwright 테스트
│   ├── helpers/            # 테스트 헬퍼 함수
│   ├── fixtures/           # 테스트 데이터
│   ├── auth/               # 인증 테스트
│   ├── teams/              # 팀 관리 테스트
│   ├── reports/            # 보고서 테스트
│   └── admin/              # 관리자 테스트
├── .claude/                # Claude Code 설정
│   └── prompts/            # 코드 생성 프롬프트
├── .vscode/                # VS Code 설정
│   └── mcp.json            # MCP 서버 설정
└── playwright.config.js    # Playwright 설정
```

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install
```

### 2. 테스트 실행
```bash
# 전체 E2E 테스트 실행
npm run test:e2e

# 브라우저 UI와 함께 실행
npm run test:e2e:headed

# 인터랙티브 UI 모드
npm run test:e2e:ui

# 특정 영역별 테스트
npm run test:auth      # 인증 테스트
npm run test:teams     # 팀 관리 테스트
npm run test:reports   # 보고서 테스트
npm run test:admin     # 관리자 테스트

# 스모크 테스트만 실행
npm run test:smoke
```

## 📝 자연어 시나리오 작성

### 시나리오 템플릿 사용
```markdown
# [기능명] 테스트 시나리오

## 시나리오 1: [시나리오 제목]

### 기본 정보
- **ID:** FEATURE_001
- **역할:** Admin/Executive/Leader/Member
- **우선순위:** Critical/High/Medium/Low
- **태그:** smoke, regression, integration
- **예상 실행 시간:** 2분

### 테스트 단계
1. **Given** [초기 상태 설명]
2. **When** [사용자 동작]
3. **Then** [기대 결과]
4. **And** [추가 검증 사항]

### 기대 결과
- ✅ 결과 1
- ✅ 결과 2

### 테스트 데이터
```yaml
user:
  email: "test@example.com"
  password: "password123"
```

### 자동화 힌트
```javascript
// 주요 셀렉터와 헬퍼 함수 제안
```

## 🤖 Claude Code를 통한 코드 생성

### 1. Claude Code 프롬프트 사용
```bash
# Claude Code에서 다음 프롬프트 사용:
"test-scenarios/auth/login-scenarios.md 파일의 시나리오를 기반으로
qa-test/auth/login.spec.js Playwright 테스트 코드를 생성해주세요."
```

### 2. 생성 규칙
- **헬퍼 함수 활용**: `loginAs()`, `navigateTo()`, `waitForElement()` 등
- **데이터 기반**: `testData` fixture 사용
- **대기 조건**: API 응답 및 요소 가시성 대기
- **검증 패턴**: expect 구문을 통한 명확한 검증
- **에러 핸들링**: try-catch 및 타임아웃 처리

### 3. 생성된 코드 예시
```javascript
test('관리자 로그인 성공', async ({ page }) => {
  // Given: 로그인 페이지에 접속한 상태에서
  await navigateTo(page, '/login');

  // When: 관리자 계정으로 로그인하면
  await loginAs(page, 'admin');

  // Then: 대시보드로 이동하고 관리자 메뉴가 표시된다
  await expect(page).toHaveURL('/');
  await expectToBeLoggedIn(page, 'ADMIN');
});
```

## 🔧 MCP(Model Context Protocol) 활용

### 설정 파일
```json
// .vscode/mcp.json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### 사용 가능한 MCP 도구
- `playwright_navigate`: 페이지 이동
- `playwright_click`: 요소 클릭
- `playwright_fill`: 폼 입력
- `playwright_screenshot`: 스크린샷 촬영
- `playwright_get_page_content`: 페이지 내용 가져오기

### Claude Code에서 MCP 사용 예시
```javascript
// 실시간 테스트 디버깅
await playwright_navigate("http://localhost:3000/login");
await playwright_fill("input[type='email']", "admin@test.com");
await playwright_click("button[type='submit']");
await playwright_screenshot("login-result.png");
```

## 📊 테스트 커버리지

### 구현된 시나리오
- ✅ **인증**: 로그인, 로그아웃, 권한 제어 (10개 시나리오)
- ✅ **팀 관리**: 생성, 수정, 삭제, 멤버 관리 (8개 시나리오)
- ✅ **보고서**: CRUD, 댓글, 첨부파일 (9개 시나리오)
- ✅ **관리자**: 사용자/동아리 관리, 승인 시스템 (10개 시나리오)
- ✅ **대시보드**: 역할별 위젯, 빠른 액세스 (4개 시나리오)

### 테스트 태그 분류
- `smoke`: 핵심 기능 스모크 테스트
- `critical`: 비즈니스 크리티컬 기능
- `regression`: 회귀 테스트
- `integration`: 통합 테스트
- `authorization`: 권한 관련 테스트

## 🎨 헬퍼 함수 라이브러리

### 인증 헬퍼 (auth-helper.js)
- `loginAs(page, role)`: 역할별 로그인
- `logout(page)`: 로그아웃
- `expectToBeLoggedIn(page, role)`: 로그인 상태 확인
- `expectLoginError(page, message)`: 로그인 에러 확인

### 네비게이션 헬퍼 (navigation-helper.js)
- `navigateTo(page, path)`: 페이지 이동
- `waitForElement(page, selector)`: 요소 대기
- `openModal(page, trigger, modal)`: 모달 열기
- `waitForApiResponse(page, pattern)`: API 응답 대기

### 테스트 데이터 (test-data.js)
- `testData.users`: 역할별 사용자 정보
- `testData.teams`: 팀 테스트 데이터
- `testData.selectors`: UI 셀렉터 상수
- `testData.api`: API 엔드포인트 상수

## 🛠 개발 워크플로우

### 1. 새로운 기능 테스트 추가
1. `test-scenarios/` 에서 자연어 시나리오 작성
2. Claude Code로 테스트 코드 생성
3. 헬퍼 함수 및 테스트 데이터 업데이트
4. 테스트 실행 및 검증

### 2. 시나리오 검증
```bash
# 시나리오 유효성 검사
npm run scenario:validate

# 시나리오 문서 자동 생성
npm run docs:scenarios
```

### 3. CI/CD 통합
```yaml
# .github/workflows/playwright.yml
- name: Run Playwright tests
  run: npx playwright test
- name: Upload test results
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## 🏆 모범 사례

### 시나리오 작성
- **명확한 단계**: Given-When-Then 패턴 사용
- **구체적 데이터**: 실제 사용할 테스트 데이터 명시
- **예외 상황**: 에러 케이스도 포함
- **자동화 힌트**: 셀렉터와 헬퍼 함수 제안

### 테스트 코드
- **데이터 기반**: 하드코딩 대신 fixture 사용
- **독립성**: 테스트 간 의존성 제거
- **재사용성**: 헬퍼 함수 적극 활용
- **명확한 검증**: 구체적인 expect 구문

### 유지보수
- **정기적 업데이트**: UI 변경 시 셀렉터 업데이트
- **테스트 리뷰**: 실패한 테스트의 원인 분석
- **성능 최적화**: 불필요한 대기 시간 제거

## 🔍 디버깅 및 문제 해결

### 일반적인 문제
1. **요소를 찾을 수 없음**: data-testid 셀렉터 우선 사용
2. **타임아웃 오류**: 적절한 대기 조건 설정
3. **불안정한 테스트**: 동적 데이터와 race condition 해결
4. **권한 오류**: 로그인 상태 및 역할 확인

### 디버깅 도구
```bash
# 헤드 모드로 실행 (브라우저 화면 보기)
npm run test:e2e:headed

# 특정 테스트만 실행
npx playwright test qa-test/auth/login.spec.js

# 디버그 모드
npx playwright test --debug

# 트레이스 뷰어
npx playwright show-trace trace.zip
```

## 📈 향후 계획

- [ ] **더 많은 시나리오**: 모든 사용자 스토리 커버
- [ ] **성능 테스트**: 로드 테스트 및 성능 측정
- [ ] **접근성 테스트**: axe-core 통합
- [ ] **시각적 테스트**: 스크린샷 비교
- [ ] **모바일 테스트**: 반응형 UI 테스트

## 📞 지원

문제가 발생하거나 개선 제안이 있으시면:
- GitHub Issues: [team-tracker-2/issues](https://github.com/hg554889/team-tracker-2/issues)
- 테스트 관련 문의: qa-automation 브랜치 확인