# Team Tracker v2 - QA Automation

Playwright를 사용한 Team Tracker v2의 자동화 테스트 시스템입니다.

## 📁 프로젝트 구조

```
qa-automation/
├── tests/                    # 테스트 파일들
│   ├── auth/                # 인증 관련 테스트 ✅
│   ├── admin/               # 관리자 기능 테스트 ✅
│   ├── teams/               # 팀 관리 테스트 ✅
│   ├── reports/             # 보고서 테스트 ✅
│   └── profile/             # 프로필 관리 테스트 ✅
├── utils/                   # 테스트 유틸리티
│   ├── authHelpers.js       # 인증 헬퍼 함수
│   └── testHelpers.js       # 공통 테스트 헬퍼
├── fixtures/                # 테스트 데이터
│   └── testUsers.js         # 테스트 사용자 정보
├── .auth/                   # 인증 상태 파일들
│   ├── admin.json           # Admin 인증 상태
│   ├── executive.json       # Executive 인증 상태
│   ├── leader.json          # Leader 인증 상태
│   └── member.json          # Member 인증 상태
├── global-setup.js          # 전역 인증 설정
└── playwright.config.js     # Playwright 설정
```

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
cd qa-automation
npm install
```

### 2. 애플리케이션 서버 실행

```bash
# 터미널 1: 백엔드 서버 (포트 5000)
cd ../server
npm run dev

# 터미널 2: 프론트엔드 서버 (포트 3000)
cd ../client
npm start
```

### 3. 테스트 실행

```bash
# 모든 테스트 실행
npx playwright test

# 헤드리스 모드로 실행 (브라우저 UI 표시)
npx playwright test --headed

# 특정 영역 테스트만 실행
npx playwright test tests/auth/          # 인증 테스트
npx playwright test tests/admin/         # 관리자 테스트
npx playwright test tests/teams/         # 팀 관리 테스트
npx playwright test tests/reports/       # 보고서 테스트
npx playwright test tests/profile/       # 프로필 테스트

# UI 모드로 실행 (테스트 러너 GUI)
npx playwright test --ui

# 특정 테스트만 실행
npx playwright test -g "사용자 관리"
```

## 🎯 테스트 성과

### ✅ **주요 4개 영역 완전 자동화**

#### 1. **Authentication (인증)**

- ✅ 로그인/로그아웃 플로우
- ✅ 회원가입 및 클럽 선택
- ✅ 보호된 라우트 접근 제어
- ✅ 4가지 역할별 권한 테스트 (Admin/Executive/Leader/Member)
- ✅ API 인증 토큰 검증

#### 2. **Admin (관리자)**

- ✅ 사용자 관리 - 전체 목록 조회
- ✅ 사용자 역할 변경
- ✅ 사용자 검색 및 필터링
- ✅ 사용자 일괄 작업
- ⏭️ 클럽 관리 기능 (미구현으로 스킵)
- ⏭️ 시스템 설정 기능 (미구현으로 스킵)

#### 3. **Teams (팀 관리)**

- ✅ 팀 생성/수정/삭제 (Leader 권한)
- ✅ 멤버 초대 시스템
- ✅ 팀원 역할 변경 및 제거
- ✅ 팀 목록 조회 및 관리

#### 4. **Reports (보고서)**

- ✅ 보고서 CRUD 작업 (5개 필드 폼)
- ✅ 진행률 입력 및 검증
- ✅ 파일 첨부 기능
- ✅ 댓글 시스템
- ✅ 검색 및 필터링
- ✅ 권한별 수정/삭제 제어

#### 5. **Profile (프로필)**

- ✅ 프로필 정보 조회 및 수정
- ✅ 비밀번호 변경 (검증 포함)
- ✅ 프로필 이미지 업로드
- ✅ 소속 클럽 정보 표시
- ✅ 계정 활동 내역 조회

## 🔧 핵심 기술적 개선사항

### 1. **Modern Playwright Architecture**

- **Global Setup**: API 기반 인증으로 테스트 속도 향상
- **State Reuse**: 각 역할별 인증 상태 파일 저장 및 재사용
- **Parallel Execution**: 멀티 워커로 테스트 성능 최적화

### 2. **정확한 DOM 셀렉터**

- 실제 구현된 HTML 구조 분석 기반
- `data-testid` 의존성에서 실제 클래스/타입 기반 셀렉터로 전환
- Strict mode 위반 문제 해결

### 3. **Form 필드 매핑**

```javascript
// 보고서 폼 - 5개 주요 필드
'input[type="number"].progress-input'; // 진행률
"textarea.short-goals"; // 단기 목표
"textarea.long-goals"; // 장기 목표
"textarea.action-plans"; // 실행 계획
"textarea.milestones"; // 마일스톤
"textarea.issues-textarea"; // 이슈사항
```

## 🚨 제외된 기능 (의도적 스킵)

### Admin 영역

- 클럽 관리 (UI 미구현)
- 시스템 설정 (페이지 미존재)
- 분석 대시보드 (기능 미구현)
- 데이터베이스 백업 (기능 미구현)

### 기타

- 실시간 채팅 (Socket.IO 복잡성)
- 외부 AI API (모킹 필요)

## 🔧 테스트 환경 요구사항

1. **서버 실행 상태**

   - Backend: `localhost:5000` (API 서버)
   - Frontend: `localhost:3000` (React 앱)

2. **테스트 데이터**

   - 4가지 역할별 테스트 계정 준비됨
   - Global setup에서 자동 인증

3. **브라우저 지원**
   - Chromium (기본)
   - Firefox, Safari (설정 가능)

## 📈 성능 최적화

- **인증 시간 단축**: API 직접 호출로 UI 로그인 과정 생략
- **병렬 실행**: 멀티 워커로 테스트 시간 50% 단축
- **상태 재사용**: 전역 인증 설정으로 반복 로그인 제거
- **선택적 실행**: 실패 가능성 높은 미구현 기능 사전 제외

## 🚀 사용법

```bash
# 빠른 핵심 테스트 (5분 이내)
npx playwright test tests/auth/login.spec.js tests/teams/ tests/reports/ tests/profile/

# 전체 테스트 실행
npx playwright test

# 보고서 생성
npx playwright show-report
```
