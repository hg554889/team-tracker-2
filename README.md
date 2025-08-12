# Team Tracker v2

협업 팀 관리와 보고서 작성/열람을 지원하는 웹 애플리케이션입니다.  
관리자(Admin)와 리더(Leader) 역할 기반의 권한 제어를 통해 효율적인 팀 운영과 프로젝트 진행 상황 공유를 할 수 있습니다.

---

## 🚀 주요 기능

### 사용자 & 권한
- 회원가입 / 로그인 / 로그아웃
- **Admin**: 모든 동아리(팀)와 모든 사용자 정보 접근 가능
- **Leader**: 소속된 팀의 정보 수정, 멤버 관리, 팀 보고서 작성 가능
- **Member**: 보고서 작성, 팀 정보 열람 가능

### 팀 관리
- 팀 생성 (Leader/Admin)
- 팀 정보 조회 / 수정 (수정은 Leader/Admin만 가능, 버튼 클릭 후 편집 모드 진입)
- 멤버 초대 링크 생성 및 가입
- 멤버 권한 변경 (Leader ↔ Member)
- 멤버 제거

### 보고서 관리
- 주차별 진행률, 목표, 이슈, 마감일, 첨부파일 작성
- 보고서 수정 / 삭제
- 팀별 보고서 목록 보기
- 보고서 상세 내용 열람 및 댓글 작성

### 프로필
- 이름, 이메일 확인
- 비밀번호 변경
- (동아리 변경 불가로 제한됨)

### 대시보드
- 로그인 후 권한별 맞춤 메인 화면 제공
- 진행 중인 프로젝트 / 최근 보고서 / 주요 알림 표시

---

## 🛠 기술 스택

### Frontend
- React (CRA 기반)
- React Router DOM
- Axios
- Recharts (진행률 차트)
- CSS 모듈 / 기본 스타일

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT 기반 인증
- Joi 입력값 검증
- Multer 파일 업로드

---

## 📂 폴더 구조

```plaintext
team-tracker-ver2/
├── client/                     # 프론트엔드 (React)
│   ├── src/
│   │   ├── api/                # Axios API 요청 함수
│   │   ├── components/         # 재사용 UI 컴포넌트
│   │   ├── contexts/           # Auth Context
│   │   ├── pages/              # 페이지 단위 컴포넌트
│   │   ├── styles/             # CSS 모듈
│   │   └── App.js
│   └── package.json
│
├── server/                     # 백엔드 (Express)
│   ├── src/
│   │   ├── models/             # Mongoose 스키마
│   │   ├── routes/             # 라우터
│   │   ├── middleware/         # 인증/검증 미들웨어
│   │   ├── utils/               # 유틸리티
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## ⚙️ 설치 및 실행
-  저장소 클론
bash
복사
편집

- git clone https://github.com/your-username/team-tracker-ver2.git
cd team-tracker-ver2

## 2. 백엔드 설치 & 실행
- bash
복사
편집
cd server
npm install
npm run dev

## 3. 프론트엔드 설치 & 실행
- bash
복사
편집
cd ../client
npm install
npm start

## 4. 환경 변수 설정
server/.env && client/.env

- hg554889@gmail.com 으로 요청

## 📌 사용 예시
회원가입 및 로그인

(미가입 상태 시) 동아리 선택

팀 생성 (Leader/Admin)

팀 멤버 초대 및 관리

보고서 작성 후 팀 페이지에서 진행률 추이 확인

Admin은 전체 동아리와 모든 보고서를 관리 가능