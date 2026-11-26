
# Schedule Manager

과제, 시험, 개인 일정을 관리하고 친구들과 공통으로
비어 있는 시간을 확인할 수 있는 웹 기반 일정 관리 서비스입니다.

## 1. 프로젝트 소개

사용자가 캘린더를 통해 자신의 일정을 관리하고,
친구 관계를 기반으로 서로의 공통 빈 시간을 확인하여
효율적으로 약속을 계획할 수 있도록 지원합니다.

## 2. 주요 기능

### 회원 관리
- [x] 회원가입
- [x] 로그인 및 로그아웃
- [x] 세션 기반 사용자 인증
- [x] 비밀번호 암호화 저장

### 일정 관리
- [x] 캘린더 기반 일정 관리
- [x] 일정 추가 (Create)
- [x] 일정 조회 (Read)
- [x] 일정 수정 (Update)
- [x] 일정 삭제 (Delete)
- [x] 일정별 색상 설정
- [x] 사용자별 일정 관리
- [x] 날짜 및 시간 유효성 검증

### 친구 관리
- [x] 아이디 기반 회원 검색 API
- [x] 친구 요청 API
- [ ] 받은 친구 요청 조회
- [ ] 보낸 친구 요청 조회
- [ ] 친구 요청 수락 및 거절
- [ ] 친구 목록 조회
- [ ] 친구 삭제
- [ ] 친구 관리 UI 연동

### 일정 공유
- [ ] 친구 선택
- [ ] 공통 빈 시간 조회
- [ ] 공통 빈 시간 시각화

## 3. 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Calendar | FullCalendar |
| Backend | Node.js, Express |
| Database | MySQL |
| DB Driver | mysql2 |
| Authentication | express-session |
| Password Hashing | bcrypt |
| Environment | dotenv |
| Version Control | Git, GitHub |

## 4. 프로젝트 구조

```text
schedule-manager/
├── index.html
├── login.html
├── signup.html
├── css/
├── js/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── schedules.js
│   │   ├── users.js
│   │   └── friends.js
│   ├── middleware/
│   │   └── requireAuth.js
│   ├── utils/
│   │   └── validation.js
│   ├── database/
│   │   └── schema.sql
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── .gitignore
└── README.md
```

### 백엔드 파일별 역할

| 파일 | 역할 |
| --- | --- |
| server.js | Express 서버 설정 및 라우터 연결 |
| db.js | MySQL Connection Pool 관리 |
| routes/auth.js | 회원가입, 로그인, 로그아웃 및 인증 정보 조회 |
| routes/schedules.js | 일정 CRUD API |
| routes/users.js | 회원 검색 API |
| routes/friends.js | 친구 관계 관리 API |
| middleware/requireAuth.js | 공통 로그인 인증 미들웨어 |
| utils/validation.js | 공통 입력값 검증 함수 |
| database/schema.sql | 데이터베이스 및 테이블 생성 |

## 5. 데이터베이스 구조

### users

회원 정보를 관리하는 테이블입니다.

| 컬럼 | 설명 |
| --- | --- |
| user_id | 회원 고유 번호 (PK) |
| login_id | 로그인 아이디 |
| password_hash | 해시 처리된 비밀번호 |
| nickname | 사용자 닉네임 |

### schedules

사용자별 일정을 관리하는 테이블입니다.

| 컬럼 | 설명 |
| --- | --- |
| schedule_id | 일정 고유 번호 (PK) |
| user_id | 회원 번호 (FK) |
| title | 일정 제목 |
| start_at | 시작 날짜 및 시간 |
| end_at | 종료 날짜 및 시간 |
| color | 일정 색상 |
| created_at | 생성 시간 |
| updated_at | 수정 시간 |

### friendships

회원 간 친구 요청 및 친구 관계를 관리하는 테이블입니다.

| 컬럼 | 설명 |
| --- | --- |
| friendship_id | 친구 관계 고유 번호 (PK) |
| requester_id | 요청을 보낸 회원 번호 (FK) |
| receiver_id | 요청을 받은 회원 번호 (FK) |
| status | 친구 요청 상태 |
| created_at | 생성 시간 |
| updated_at | 수정 시간 |

친구 관계 상태는 다음과 같습니다.

- pending: 요청 대기
- accepted: 요청 수락
- rejected: 요청 거절

## 6. 설치 및 실행 방법

### 6-1. 사전 설치

- Node.js
- npm
- MySQL Server
- Git

### 6-2. 저장소 다운로드

```bash
git clone https://github.com/kw-oss-team14-2026/schedule-manager.git
cd schedule-manager
```

개발 중인 기능을 확인하려면 해당 기능 브랜치로 이동합니다.

### 6-3. 패키지 설치

```bash
cd backend
npm install
```

### 6-4. 데이터베이스 생성

MySQL에서 다음 SQL 파일을 실행합니다.

```text
backend/database/schema.sql
```

### 6-5. 환경 변수 설정

backend 폴더의 .env.example을 참고하여
.env 파일을 생성합니다.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=login_test_db
PORT=3000
SESSION_SECRET=your_session_secret
```

DB_PASSWORD와 SESSION_SECRET은 자신의 환경에 맞게 설정합니다.

.env 파일에는 민감한 정보가 포함되므로
GitHub에 업로드하지 않습니다.

### 6-6. 서버 실행

backend 디렉터리에서 다음 명령어를 실행합니다.

```bash
node server.js
```

웹 브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:3000
```

## 7. API 명세

### 서버 상태 확인

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | /api/health | 서버 상태 확인 |
| GET | /api/db-test | DB 연결 확인 |

### 회원 인증 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 |
| GET | /api/auth/me | 로그인 회원 정보 조회 |

### 일정 관리 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | /api/schedules | 일정 추가 |
| GET | /api/schedules | 일정 조회 |
| PUT | /api/schedules/:id | 일정 수정 |
| DELETE | /api/schedules/:id | 일정 삭제 |

### 회원 검색 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | /api/users/search?login_id=아이디 | 회원 검색 |

### 친구 관리 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | /api/friends/request | 친구 요청 |

일정 관리, 회원 검색 및 친구 관리 API는
로그인 인증이 필요합니다.

## 8. 백엔드 설계

백엔드는 기능별 라우터와 공통 모듈을 분리하여
코드의 유지보수성과 재사용성을 높였습니다.

- Router: 기능별 API 관리
- Middleware: 공통 사용자 인증 처리
- Utils: 공통 입력값 검증
- Connection Pool: 데이터베이스 연결 관리

## 9. 보안 및 데이터 관리

- bcrypt를 이용한 비밀번호 해시 저장
- 세션 기반 로그인 인증
- SQL Parameter Binding을 통한 SQL Injection 방지
- 사용자별 일정 접근 권한 검증
- 친구 관계 중복 생성 방지
- 환경 변수를 통한 민감한 정보 관리

## 10. 향후 개발 계획

- 친구 요청 조회 및 수락, 거절 기능 구현
- 친구 목록 조회 및 삭제 기능 구현
- 친구 관리 프론트엔드 연동
- 친구 간 공통 빈 시간 탐색 기능 구현
- 사용자 인터페이스 개선
- 전체 기능 통합 테스트
