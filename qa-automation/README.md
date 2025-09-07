# Team Tracker v2 - QA Automation

Playwright를 사용한 Team Tracker v2의 자동화 테스트 시스템입니다.

## 📁 프로젝트 구조

```
qa-automation/
├── tests/                    # 테스트 파일들
│   ├── auth/                # 인증 관련 테스트
│   ├── roles/               # 권한 관련 테스트
│   ├── teams/               # 팀 관리 테스트
│   ├── reports/             # 보고서 테스트
│   └── dashboard/           # 대시보드 테스트
├── utils/                   # 테스트 유틸리티
│   ├── authHelpers.js       # 인증 헬퍼 함수
│   └── testHelpers.js       # 공통 테스트 헬퍼
├── fixtures/                # 테스트 데이터
│   └── testUsers.js         # 테스트 사용자 정보
├── config/                  # 설정 파일
│   └── routes.js            # 라우트 정의
└── playwright.config.js     # Playwright 설정
```

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
cd qa-automation
npm install
```

### 2. 환경 설정
```bash
# .env 파일 생성 (.env.example 참고)
cp .env.example .env
```

### 3. 애플리케이션 서버 실행
```bash
# 터미널 1: 백엔드 서버 (포트 5000)
cd ../server
npm run dev

# 터미널 2: 프론트엔드 서버 (포트 3000)  
cd ../client
npm start
```

### 4. 테스트 실행
```bash
# 모든 테스트 실행
npm test

# 헤드리스 모드로 실행 (브라우저 UI 표시)
npm run test:headed

# 디버그 모드로 실행
npm run test:debug

# UI 모드로 실행 (테스트 러너 GUI)
npm run test:ui

# 특정 카테고리 테스트만 실행
npm run test:auth      # 인증 테스트
npm run test:roles     # 권한 테스트
npm run test:teams     # 팀 관리 테스트
npm run test:reports   # 보고서 테스트
```

## 📋 테스트 범위

### ✅ 완전 자동화 테스트

#### 1. **인증 시스템**
- 로그인/로그아웃 플로우
- 회원가입 및 클럽 선택
- 보호된 라우트 접근 제어
- 토큰 검증 및 만료 처리

#### 2. **권한 관리**
- 4가지 역할별 접근 제어 (Admin/Executive/Leader/Member)
- 역할별 대시보드 표시
- 권한별 메뉴 및 버튼 제어
- API 엔드포인트 권한 검증

#### 3. **팀 관리**
- 팀 생성/수정/삭제 (Leader 권한)
- 멤버 초대 링크 생성 및 사용
- 팀원 역할 변경 및 제거
- 팀 목록 조회 및 검색

#### 4. **보고서 시스템**
- 보고서 CRUD 작업
- 파일 첨부 및 다운로드
- 댓글 시스템
- 검색 및 필터링

### ⚠️ 제한적 테스트 영역

1. **실시간 기능** - Socket.IO 채팅/협업 (복잡한 설정 필요)
2. **외부 API** - Google Gemini AI 기능 (모킹 필요)
3. **파일 처리** - 실제 파일 내용 검증 (UI 레벨만 테스트)

## 🎯 테스트 실행 결과

### 성공 예시
```bash
✅ 인증 테스트: 로그인/로그아웃 플로우
✅ 권한 테스트: 4개 역할별 접근 제어  
✅ 팀 테스트: 생성/수정/멤버관리
✅ 보고서 테스트: CRUD 및 파일 첨부

Running 47 tests using 4 workers
  47 passed (2.3m)
```

### 실패 시 디버깅
```bash
# 실패한 테스트만 재실행
npm run test:debug -- --grep "실패한 테스트 이름"

# 스크린샷 및 비디오 확인
ls test-results/
```

## 📊 테스트 보고서

```bash
# HTML 보고서 생성 및 확인
npm run report
```

## 🔧 커스터마이징

### 새로운 테스트 추가
```javascript
// tests/new-feature/example.spec.js
import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/authHelpers.js';

test.describe('새 기능 테스트', () => {
  test('새 기능 동작 확인', async ({ page }) => {
    await loginAs(page, 'member');
    // 테스트 코드 작성
  });
});
```

### 테스트 사용자 추가
```javascript
// fixtures/testUsers.js에 새 사용자 추가
export const testUsers = {
  newRole: {
    name: 'New Role User',
    email: 'newrole@test.com',
    password: 'NewRole123!',
    role: 'NEW_ROLE'
  }
};
```

## 🚨 주의사항

1. **테스트 데이터 정리**: 각 테스트는 독립적으로 실행되어야 함
2. **서버 상태**: 테스트 실행 전 개발 서버가 실행 중이어야 함
3. **브라우저 버전**: Playwright가 지원하는 브라우저 버전 확인 필요
4. **네트워크 지연**: 느린 네트워크에서는 timeout 설정 조정 필요

## 📈 향후 개선 계획

- [ ] CI/CD 파이프라인 통합
- [ ] 성능 테스트 추가  
- [ ] 크로스 브라우저 호환성 확대
- [ ] 모바일 반응형 테스트
- [ ] API 테스트 자동화
- [ ] 테스트 커버리지 리포팅