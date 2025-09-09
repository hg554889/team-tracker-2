# 🚀 Team Tracker v2 QA 자동화 완전 사용 가이드

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [100% 성공률 달성 영역](#100-성공률-달성-영역)
3. [테스트 실행 방법](#테스트-실행-방법)
4. [결과 분석](#결과-분석)
5. [트러블슈팅](#트러블슈팅)
6. [고급 기능](#고급-기능)

---

## ⚡ 빠른 시작

### **30초 만에 테스트 실행하기**

```bash
# 1. QA 폴더로 이동
cd qa-automation

# 2. 서버 실행 (2개 터미널 필요)
# 터미널 1: cd ../server && npm run dev
# 터미널 2: cd ../client && npm start

# 3. 핵심 테스트 실행 (5분 이내 완료)
npx playwright test tests/auth/login.spec.js tests/teams/ tests/reports/ tests/profile/

# 4. 결과 확인
npx playwright show-report
```

---

### ✅ **1. Authentication (인증)**

```bash
# 인증 테스트만 실행
npx playwright test tests/auth/
```

**포함 기능:**

- 🔐 로그인/로그아웃 플로우
- 👥 4가지 역할별 권한 테스트 (Admin/Executive/Leader/Member)
- 🛡️ 보호된 라우트 접근 제어
- 📝 회원가입 및 승인 프로세스
- 🔑 API 토큰 검증

### ✅ **2. Admin (관리자)**

```bash
# 관리자 기능 테스트
npx playwright test tests/admin/
```

**포함 기능:**

- 👤 사용자 관리 - 목록 조회, 역할 변경
- 🔍 사용자 검색 및 필터링
- 📦 사용자 일괄 작업
- 🚫 **제외**: 클럽 관리, 시스템 설정 (UI 미구현)

### ✅ **3. Teams (팀 관리)**

```bash
# 팀 관리 테스트
npx playwright test tests/teams/
```

**포함 기능:**

- 🏗️ 팀 생성/수정/삭제 (Leader 권한)
- 📧 멤버 초대 시스템
- 👥 팀원 역할 변경 및 제거
- 📋 팀 목록 조회 및 관리

### ✅ **4. Reports (보고서)**

```bash
# 보고서 기능 테스트
npx playwright test tests/reports/
```

**포함 기능:**

- 📝 보고서 CRUD (5개 필드 폼)
- 📊 진행률 입력 및 검증
- 📎 파일 첨부 기능
- 💬 댓글 시스템
- 🔍 검색 및 필터링
- 🔒 권한별 수정/삭제 제어

### ✅ **5. Profile (프로필)**

```bash
# 프로필 관리 테스트
npx playwright test tests/profile/
```

**포함 기능:**

- 👤 프로필 정보 조회 및 수정
- 🔐 비밀번호 변경 (검증 포함)
- 🖼️ 프로필 이미지 업로드
- 🏢 소속 클럽 정보 표시
- 📈 계정 활동 내역 조회

---

## 🧪 테스트 실행 방법

### **시나리오별 실행**

```bash
# 🚀 빠른 검증 (핵심 기능만)
npx playwright test tests/auth/login.spec.js tests/teams/ tests/reports/

# 🎯 특정 영역 집중 테스트
npx playwright test tests/admin/admin-management.spec.js

# 🔍 특정 기능만 테스트
npx playwright test -g "사용자 관리"
npx playwright test -g "보고서 생성"

# 👀 브라우저 보면서 실행 (디버그)
npx playwright test --headed

# 🎮 UI 모드 (테스트 선택 및 실행)
npx playwright test --ui

# 📊 전체 테스트 + 보고서 생성
npx playwright test && npx playwright show-report
```

### **성능 옵션**

```bash
# ⚡ 병렬 실행 (워커 수 조정)
npx playwright test --workers=4

# 🎯 실패한 테스트만 재실행
npx playwright test --last-failed

# ⏱️ 타임아웃 조정 (느린 환경)
npx playwright test --timeout=60000
```

---

## 📊 결과 분석

### **성공적인 실행 예시**

```bash
Running 47 tests using 4 workers

✅ tests/auth/login.spec.js:14:3 › 유효한 사용자 로그인 성공
✅ tests/admin/admin-management.spec.js:6:3 › 사용자 관리 - 전체 사용자 목록 조회
✅ tests/teams/team-management.spec.js:7:3 › 새 팀 생성 성공
✅ tests/reports/report-crud.spec.js:7:3 › 보고서 생성 - 모든 필수 필드 입력
✅ tests/profile/profile-management.spec.js:6:3 › 프로필 정보 조회

🎉 47 passed (2.3m)
```

### **실패 시 디버깅**

```bash
# 🔍 실패 상세 정보 확인
cat test-results/*/test-failed-*.png  # 스크린샷
cat test-results/*/trace.zip          # 트레이스 파일

# 🎥 실패 비디오 확인
ls test-results/*/*.webm

# 🐛 디버그 모드로 재실행
npx playwright test "실패한 테스트 이름" --debug
```

---

## 🚨 트러블슈팅

### **자주 발생하는 문제들**

#### 1. **서버 연결 실패**

```bash
Error: connect ECONNREFUSED ::1:3000
```

**해결책:**

```bash
# 서버 상태 확인
curl http://localhost:3000
curl http://localhost:5000/api/health

# 서버 재시작
cd ../server && npm run dev
cd ../client && npm start
```

#### 2. **인증 토큰 만료**

```bash
Error: 401 Unauthorized
```

**해결책:**

```bash
# 인증 상태 파일 재생성
rm -rf .auth/
npx playwright test  # 자동으로 재생성됨
```

#### 3. **브라우저 다운로드 실패**

```bash
Error: browserType.launch
```

**해결책:**

```bash
# 브라우저 수동 설치
npx playwright install chromium
```

#### 4. **테스트 타임아웃**

```bash
Test timeout of 30000ms exceeded
```

**해결책:**

```bash
# playwright.config.js에서 타임아웃 증가
timeout: 60000  // 60초로 증가
```

### **환경별 설정**

#### **Windows**

```bash
# PowerShell에서 실행
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **macOS/Linux**

```bash
# 권한 문제 해결
chmod +x node_modules/.bin/playwright
```

---

## 🔧 고급 기능

### **커스텀 테스트 작성**

```javascript
// tests/custom/my-test.spec.js
import { test, expect } from "@playwright/test";
import { loginAs } from "../../utils/authHelpers.js";

test.describe("새로운 기능 테스트", () => {
  test("특정 기능 검증", async ({ page }) => {
    await loginAs(page, "member");

    await page.goto("/custom-page");
    await expect(page.locator('[data-testid="custom-element"]')).toBeVisible();
  });
});
```

### **테스트 데이터 관리**

```javascript
// fixtures/customData.js
export const customTestData = {
  teamName: `QA 테스트 팀 ${Date.now()}`,
  reportData: {
    title: "자동화 테스트 보고서",
    progress: 85,
    goals: "테스트 자동화 완성",
  },
};
```

### **환경별 설정**

```javascript
// playwright.config.js 커스터마이징
module.exports = {
  testDir: "./tests",
  timeout: process.env.CI ? 60000 : 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
};
```

---

## 📈 성능 최적화 팁

### **속도 향상**

1. **병렬 실행**: `--workers=4` 옵션 사용
2. **선택적 실행**: 변경된 영역만 테스트
3. **상태 재사용**: Global setup 활용
4. **헤드리스 모드**: UI 없이 실행

### **안정성 향상**

1. **재시도 설정**: 네트워크 이슈 대응
2. **타임아웃 조정**: 환경에 맞게 설정
3. **대기 조건**: 동적 컨텐츠 로딩 완료 확인

### **리소스 관리**

1. **브라우저 정리**: 테스트 후 자동 종료
2. **스크린샷 관리**: 실패 시만 저장
3. **로그 레벨**: 필요한 정보만 출력

---

## 🚀 빠른 참조

```bash
# 🎯 핵심 명령어
npx playwright test                    # 전체 테스트
npx playwright test --headed          # 브라우저 보면서 실행
npx playwright test --ui              # UI 모드
npx playwright show-report            # 보고서 열기

# 🔍 영역별 테스트
npx playwright test tests/auth/        # 인증
npx playwright test tests/admin/       # 관리자
npx playwright test tests/teams/       # 팀 관리
npx playwright test tests/reports/     # 보고서
npx playwright test tests/profile/     # 프로필

# 🛠️ 유용한 옵션
--workers=4                           # 병렬 실행
--timeout=60000                       # 타임아웃 조정
--retries=2                           # 재시도 횟수
-g "테스트 이름"                      # 특정 테스트만
```
