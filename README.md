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
- [x] 비밀번호 해시 저장

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
- [x] 아이디 기반 회원 검색 및 친구 요청
- [x] 받은 요청 및 보낸 요청 조회
- [x] 친구 요청 수락 및 거절
- [x] 친구 목록 조회 및 삭제
- [x] 친구 관리 UI 연동

### 일정 공유
- [x] 친구 선택 및 공유방 생성
- [x] 공유방 목록 및 받은 초대 조회
- [x] 초대 수락 및 거절, 초대 알림 배지
- [x] 공유방 나가기 및 마지막 참여자 퇴장 시 방 삭제
- [x] 공유방 상세 정보 및 참여자 조회
- [x] 참여자별 실제 주간 일정 조회 (읽기 전용)
- [x] 전체 참여자의 공통 빈 시간 계산 및 초록색 시각화

### 일정 검색 및 일정 알림
- [ ] 일정 검색 기능 통합 및 검증
- [ ] 일정 시작 시각 기반 알림 기능 통합 및 검증

> 개발 현황 기준: 2026-11-26, `feat/schedule-sharing` 브랜치. 체크 표시는 코드 구현 기준이며 전체 통합 테스트 완료를 의미하지 않습니다. 검색 및 일정 알림은 중간보고서 기준 개별 기능 코드가 작성되었으나 현재 통합 상태는 미확인입니다. 공유방 초대 알림과 일정 시작 알림은 별개입니다.

## 3. 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Calendar | FullCalendar 7.1.1 (Monarch) |
| Backend | Node.js, Express |
| Database | MySQL 8.4 (개발 기준) |
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
├── share-room.html
├── css/
│   ├── friends.css
│   ├── sharing.css
│   └── share-room.css
├── js/
│   ├── friends.js
│   ├── sharing.js
│   └── share-room.js
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── schedules.js
│   │   ├── users.js
│   │   ├── friends.js
│   │   └── sharing.js
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

위 구조는 주요 파일 기준이며 다른 기능 브랜치의 파일은 통합 후 추가될 수 있습니다.

### 백엔드 파일별 역할

| 파일 | 역할 |
| --- | --- |
| server.js | Express 서버 설정 및 라우터 연결 |
| db.js | MySQL Connection Pool 관리 |
| routes/auth.js | 회원가입, 로그인, 로그아웃 및 인증 정보 조회 |
| routes/schedules.js | 일정 CRUD API |
| routes/users.js | 회원 검색 API |
| routes/friends.js | 친구 관계 관리 API |
| routes/sharing.js | 공유방, 초대, 참여자 및 공유 일정 API |
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

### sharing_rooms

공유방 기본 정보를 관리합니다.

| 컬럼 | 설명 |
| --- | --- |
| room_id | 공유방 번호 (PK) |
| room_name | 공유방 이름 |
| creator_id | 생성자 회원 번호 (FK, NULL 허용) |
| created_at | 생성 시간 |

### sharing_room_members

공유방 참여 및 초대 상태를 관리합니다.

| 컬럼 | 설명 |
| --- | --- |
| room_id | 공유방 번호 (FK, 복합 PK) |
| user_id | 회원 번호 (FK, 복합 PK) |
| invited_by | 초대한 회원 번호 (FK, NULL 허용) |
| status | pending / accepted / rejected |
| created_at | 초대 또는 생성 시간 |
| joined_at | 참여 수락 시간 (NULL 허용) |
| updated_at | 수정 시간 |

공유방 삭제 시 관련 참여자 레코드는 CASCADE로 삭제됩니다. 개인 일정은 기존 `schedules` 테이블에서 조회하며 공유방에 복제하지 않습니다.

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

일정 공유까지 구현된 개발 브랜치를 확인하려면 다음 명령을 실행합니다.

```bash
git fetch origin
git switch feat/schedule-sharing
git pull --ff-only origin feat/schedule-sharing
```

기존 작업이 있다면 먼저 커밋하거나 백업합니다. 위 명령은 main에 병합하는 명령이 아닙니다.

### 6-3. 패키지 설치

```bash
cd backend
npm install
```

Windows PowerShell에서 npm 실행 정책 오류가 발생하면 `npm.cmd install`을 사용합니다.

### 6-4. 데이터베이스 생성

MySQL에서 다음 SQL 파일을 실행합니다.

```text
backend/database/schema.sql
```

기존 개발자는 DB를 백업한 후 최신 `schema.sql`을 실행하여 `sharing_rooms`, `sharing_room_members` 테이블을 추가합니다. 기존 테이블과 데이터는 삭제하지 않습니다. `CREATE TABLE IF NOT EXISTS`는 기존 테이블의 컬럼이나 제약조건을 변경하지 않으므로 오래된 스키마는 별도 비교 및 마이그레이션이 필요합니다. 기본 DB 이름은 `login_test_db`이며 다른 이름을 사용한다면 SQL의 대상 DB와 `.env`를 일치시킵니다.

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
| GET | /api/friends/requests/received | 받은 친구 요청 조회 |
| GET | /api/friends/requests/sent | 보낸 친구 요청 조회 |
| PATCH | /api/friends/requests/:id | 친구 요청 수락 및 거절 |
| GET | /api/friends | 친구 목록 조회 |
| DELETE | /api/friends/:id | 친구 삭제 |

### 일정 공유 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | /api/sharing/rooms | 공유방 생성 및 친구 초대 |
| GET | /api/sharing/rooms | 내 공유방 목록 조회 |
| GET | /api/sharing/invites | 받은 초대 조회 |
| PATCH | /api/sharing/invites/:roomId | 초대 수락 및 거절 |
| DELETE | /api/sharing/rooms/:roomId/members/me | 공유방 나가기 |
| GET | /api/sharing/rooms/:roomId | 공유방 상세 및 참여자 조회 |
| GET | /api/sharing/rooms/:roomId/schedules | 기간별 참여자 일정 조회 |

공유방 생성 요청 예시:

```json
{"room_name":"팀 프로젝트","friend_ids":[2,3]}
```

초대 처리 요청 예시: `{"status":"accepted"}` 또는 `{"status":"rejected"}`.

일정 조회 요청 예시:

```http
GET /api/sharing/rooms/1/schedules?start=2026-11-22T00:00&end=2026-11-29T00:00
```

날짜는 로컬 시각 `YYYY-MM-DDTHH:mm` 형식이며 종료 시점은 포함하지 않습니다. 일정 응답의 주요 필드는 `schedule_id`, `user_id`, `title`, `start_at`, `end_at`, `color`입니다.

일정 관리, 회원 검색, 친구 관리 및 일정 공유 API는 로그인 인증이 필요합니다.

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

## 10. 일정 공유 동작 및 정책

- 친구 관계가 수락된 회원만 공유방 생성 시 초대할 수 있습니다.
- 초대를 수락한 참여자만 공유방 상세 정보와 일정을 조회할 수 있습니다.
- 공유방 참여자는 서로의 일정 제목, 시간 및 색상을 읽기 전용으로 확인할 수 있습니다.
- 공유방 입장 시 본인 일정이 기본으로 선택되며, 참여자를 변경해도 조회 중인 주는 유지됩니다.
- 공통 빈 시간은 모든 참여자의 일정 구간을 합친 뒤 해당 주에서 비어 있는 구간을 계산합니다.
- 마지막 수락 참여자가 나가면 공유방 및 남은 초대 정보가 삭제됩니다. 개인 일정은 유지됩니다.
- 초대 배지는 페이지 접속, 모달 열기 및 초대 처리 시 갱신합니다. 실시간 푸시 알림은 제공하지 않습니다.
- 일정은 입장 및 주간 이동 시 다시 조회합니다. 실시간 동기화와 기존 공유방 추가 초대 UI는 현재 범위에 포함되지 않습니다.

## 11. 팀 통합 및 테스트

- 기능 브랜치에서 작업하고 PR 및 코드 리뷰 후 병합합니다. 중간보고서의 협업 기준은 최소 1명 승인입니다.
- 검색 및 일정 알림 기능은 기존 로그인 세션과 `/api/schedules`의 실제 DB 데이터에 연결합니다.
- `index.html`의 캘린더 초기화, 로그인 상태 처리, 일정 CRUD 및 친구/공유 UI를 보존하며 충돌을 해결합니다.
- 일정 제목, `schedule_id`, `start_at`, `end_at`, `color` 등 기존 API 필드와 날짜 형식을 유지합니다.
- 각 팀원의 로컬 MySQL 데이터는 별개입니다. 통합 테스트용 계정과 일정을 직접 생성합니다.
- 서버를 재시작한 후 `/api/health`, `/api/db-test`를 확인합니다.

### 통합 테스트 체크리스트

- [ ] 회원가입, 로그인, 로그아웃 및 인증 오류 처리
- [ ] 일정 CRUD 및 새로고침 후 데이터 유지
- [ ] 친구 요청, 수락, 거절 및 삭제
- [ ] 공유방 생성, 초대 배지, 수락, 거절 및 나가기
- [ ] 참여자별 실제 일정, 주간 이동 및 공통 빈 시간 표시
- [ ] 미수락 회원 및 비회원의 공유방 접근 차단
- [ ] 검색 및 일정 알림의 실제 일정 데이터 연동
- [ ] 브라우저 콘솔 오류 및 기능 간 충돌 확인

## 12. 향후 개발 계획

- 일정 검색 및 일정 알림 기능 통합
- 전체 기능 통합 테스트 및 UI 개선
- 정적 파일 제공 범위 제한 (backend 디렉터리 및 민감 파일 노출 방지)
- 운영 환경용 세션 저장소, HTTPS 및 쿠키 보안 설정 검토
- 일정 조회 기간 제한 등 API 안정성 보완
- 최종 문서 정리 및 GitHub Release v1.0 등록

현재 서버는 로컬 개발용입니다. 정적 파일 제공 범위와 운영 환경 보안 설정을 개선하기 전에는 외부에 공개하지 않습니다.

## 13. 오픈소스 및 라이선스

중간보고서에서 프로젝트 라이선스로 MIT를 선정했습니다. 최종 병합 시 실제 `LICENSE` 파일과 사용 라이브러리의 버전별 라이선스 및 고지 사항을 확인합니다.

주요 활용 오픈소스: [FullCalendar](https://github.com/fullcalendar/fullcalendar), [Express](https://github.com/expressjs/express), [mysql2](https://github.com/sidorares/node-mysql2), [bcrypt](https://github.com/kelektiv/node.bcrypt.js), [express-session](https://github.com/expressjs/session), [dotenv](https://github.com/motdotla/dotenv). 중간보고서에는 날짜 계산용 Day.js도 기재되어 있으며 최종 통합 시 실제 사용 여부를 확인합니다.
