# HSA Frontend FE팀 공유 문서

HSA Frontend는 AI 기반 고객 문의 분류 및 응답 초안 관리 콘솔입니다. 이 문서는 FE팀 노션에 공유하기 위한 운영 기준, 참고 문서, 온보딩, API 정리본입니다.

## 1. FE팀 컨벤션

### 1.1 기술 스택 기준

- React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3.4, React Router 6을 기본 스택으로 사용합니다.
- API 통신은 `src/lib/api.ts`의 API client를 통해서만 호출합니다.
- 백엔드가 없는 PoC 환경에서는 MSW가 `/api/*` 요청을 intercept합니다.
- 아이콘은 `lucide-react`를 우선 사용하고, 직접 SVG 작성은 최소화합니다.

### 1.2 파일 구조 기준

- 화면 단위 구현은 `src/pages/`에 둡니다.
- 공통 UI는 `src/components/`에 둡니다.
- 도메인 타입은 `src/types/domain.ts`에 모읍니다.
- Mock API와 Mock DB는 각각 `src/mocks/handlers.ts`, `src/mocks/data.ts`에서 관리합니다.

### 1.3 UI 작성 기준

- 디자인 토큰은 `src/styles/tokens.css`의 CSS custom properties를 우선 사용합니다.
- Tailwind class는 토큰 기반 색상(`bg`, `surface`, `ink`, `brand`, `line`)을 사용합니다.
- 상태, 채널, 문의 유형 표현은 `src/lib/meta.ts`와 Badge 컴포넌트를 통해 일관되게 관리합니다.
- 관리자 콘솔 특성상 정보 밀도, 상태 구분, 다음 액션 가시성을 우선합니다.

### 1.4 코드 품질 기준

- TypeScript 타입을 명시하고 `any` 사용은 피합니다.
- 화면에서 직접 fetch하지 않고 `api` client를 사용합니다.
- 공통 UI 패턴은 Button, Card, Badge, Table, FormControls 등을 재사용합니다.
- 변경 후 `npm run lint`, `npm run build`로 최소 검증합니다.

## 2. 문서

### 2.1 README

- 위치: `README.md`
- 목적: 설치, 실행, 라우트, MSW mock 방식 설명
- 신규 팀원은 가장 먼저 README를 확인합니다.
- PoC 실행 방법이 변경되면 README도 함께 업데이트합니다.

### 2.2 기능 스펙 문서

- 위치: `feature-spec.md`
- 목적: HSA Frontend의 핵심 사용자 흐름과 기능 요구사항 정리
- 문의 유입, AI 분류, 자동응답, RAG 초안, 관리자 검토 흐름을 기준으로 봅니다.
- 신규 기능 추가 시 요구사항과 실제 구현 차이를 기록합니다.

### 2.3 디자인/레이아웃 문서

- 위치: `hsa_admin_layout.md`, `docs/figma-design-plan.md`
- 목적: 관리자 콘솔의 정보 구조와 디자인 방향 정리
- 제품 톤은 premium B2B SaaS, AI operation center를 기준으로 합니다.
- 화면 변경 시 주요 레이아웃 의도를 문서에 남깁니다.

### 2.4 FE팀 공유 문서

- 위치: `docs/fe-team-notion-share.md`
- 목적: 노션에 복사해서 공유할 수 있는 FE팀 운영 요약본
- 컨벤션, 문서, 온보딩, API를 빠르게 파악하는 용도입니다.
- 팀 기준이 바뀌면 이 문서를 함께 갱신합니다.

## 3. 온보딩

### 3.1 로컬 환경 준비

```bash
npm install
npm run dev
```

- Vite dev server가 실행되면 브라우저에서 표시된 localhost URL로 접속합니다.
- 기본 진입은 `/login`입니다.
- 현재 인증은 mock이며, 로그인 버튼 클릭 후 `/dashboard`로 이동합니다.
- 백엔드 서버 없이도 MSW mock API로 모든 화면을 확인할 수 있습니다.

### 3.2 핵심 화면 흐름 이해

- `/dashboard`: 전체 문의 현황, 검토 큐, 파이프라인, 최근 로그를 봅니다.
- `/inquiries`: 채널, 유형, 상태, 검색어로 문의를 필터링합니다.
- `/inquiries/:id`: 원문, AI 분류, 신뢰도, 초안, 근거 문서, 발송 액션을 검토합니다.
- `/dev/intake`: 테스트 문의를 생성해 전체 처리 흐름을 시연합니다.

### 3.3 Mock 데이터 수정 방법

- 초기 문의 데이터는 `src/mocks/data.ts`의 `inquiries`에서 수정합니다.
- 문서 데이터는 `documents`, RAG 참고 문서는 `sourceDocuments`에서 수정합니다.
- API 동작은 `src/mocks/handlers.ts`에서 수정합니다.
- 상태 변경 시 로그가 필요하면 `appendLog` 호출도 함께 추가합니다.

### 3.4 개발 전 확인 체크리스트

- 기존 컴포넌트와 디자인 토큰을 먼저 확인합니다.
- 새 타입이 필요하면 `src/types/domain.ts`에 추가합니다.
- API가 필요하면 `src/lib/api.ts`와 `src/mocks/handlers.ts`를 함께 수정합니다.
- 완료 후 `npm run lint`, `npm run build`를 실행합니다.

## 4. API

### 4.1 인증 API

- `GET /api/auth/session`: 현재 mock session 조회
- `POST /api/auth/login`: mock 관리자 로그인
- `POST /api/auth/logout`: mock 로그아웃
- 실제 인증 연동 전까지는 MSW handler에서 session state를 관리합니다.

### 4.2 문의 API

- `GET /api/inquiries`: 문의 목록 조회
- Query: `channel`, `type`, `status`, `query`
- `GET /api/inquiries/:id`: 문의 상세 조회
- 문의 데이터에는 채널, 고객 정보, 원문, AI 분류, 상태, 신뢰도, 초안 정보가 포함됩니다.

### 4.3 응답 처리 API

- `PATCH /api/inquiries/:id/draft`: 관리자 수정 답변 임시저장
- `POST /api/inquiries/:id/send`: 최종 답변 발송 처리
- `POST /api/inquiries/:id/review-required`: 검토 필요 상태로 변경
- 각 액션은 mock state를 업데이트하고 처리 로그를 추가합니다.

### 4.4 운영/개발 API

- `GET /api/logs`: 처리 로그 조회
- `GET /api/documents`: RAG 문서 목록 조회
- `POST /api/documents`: mock 문서 추가
- `DELETE /api/documents/:id`: mock 문서 삭제
- `POST /api/dev/intake`: 개발용 문의 주입 및 mock AI 처리 시뮬레이션

