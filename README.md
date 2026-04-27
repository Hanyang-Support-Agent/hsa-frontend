# HSA Frontend

고객문의 분류/답변 초안 에이전트의 **PoC 관리자 콘솔**이다.
카카오톡·인스타그램·이메일로 들어온 고객 문의를 AI가 자동 분류하고, DB 조회 또는 RAG로 응답을 생성한 뒤 관리자가 검토·발송하는 흐름을 검증한다.

---

## Tech Stack

| 분류 | 사용 기술 |
|---|---|
| 프레임워크 | React 18 + Vite 6 + TypeScript 5.7 |
| 스타일 | Tailwind CSS 3.4 + CSS 커스텀 토큰 |
| 라우팅 | React Router 6 |
| API 목킹 | MSW 2.6 (Mock Service Worker) |
| 아이콘 | Lucide React |

> PoC이므로 실제 백엔드 없이 MSW가 모든 API 요청을 가로채 mock 데이터를 반환한다.

---

## 시스템 흐름

```
[고객 문의 유입]
카카오톡 / 인스타그램 / 이메일
        │
        ▼ (PoC에서는 /dev/intake 로 수동 주입)
[문의 수집 · 저장]  →  채널 / 고객 정보 / 문의 원문 / 접수 시각 기록
        │
        ▼
[자동 분류]  →  배송 / 교환·환불 / 상품 / 기타
        │
        ├─ DB 조회로 응답 가능? ─── YES ──▶ [자동응답 생성 · 발송]
        │
        └─ NO ──▶ [RAG 초안 생성]  →  정책/상품/FAQ 문서 검색
                        │
                        ▼
              [관리자 검토 · 수정 · 발송]
                        │
                        ▼
                  [로그 기록]
```

---

## 화면 및 라우트

| 라우트 | 화면 | 설명 |
|---|---|---|
| `/login` | 로그인 | mock 관리자 로그인 |
| `/dashboard` | 대시보드 | 처리 현황 통계 카드(4종) + 최근 처리 로그 |
| `/inquiries` | 문의 목록 | 채널 / 유형 / 상태 / 키워드 필터, 전체 문의 테이블 |
| `/inquiries/:id` | 문의 상세 | 원문 확인, AI 초안 편집, 임시저장 / 발송 |
| `/logs` | 로그 조회 | 문의 처리 이벤트 전체 이력, 키워드 검색 |
| `/documents` | 문서 관리 | 정책·FAQ·상품 문서 등록·목록·삭제 |
| `/dev/intake` | 문의 주입 (개발용) | 채널별 mock 문의 생성 → 전체 흐름 시뮬레이션 |

---

## 문의 처리 상태

| 상태값 | 표시명 | 설명 |
|---|---|---|
| `received` | 접수됨 | 문의 수집 직후 |
| `classified` | 분류 완료 | AI 유형 분류 완료 |
| `auto_replied` | 자동응답 완료 | DB 조회로 즉시 발송됨 |
| `draft_ready` | 초안 생성 완료 | RAG 초안이 준비됨 |
| `review_required` | 관리자 검토 필요 | 복합 문의 등 수동 처리 필요 |
| `saved` | 임시저장됨 | 관리자가 초안을 저장한 상태 |
| `sent` | 발송 완료 | 최종 응답 발송됨 |
| `failed` | 처리 실패 | 오류 발생 |

---

## 개발 명령어

```bash
npm install       # 의존성 설치
npm run dev       # 개발 서버 시작 (Vite, MSW 자동 활성화)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 검사
npm run preview   # 프로덕션 빌드 미리보기
```

> `npm run dev` 실행 시 MSW Service Worker가 자동으로 등록되어 `/api/*` 요청을 mock 핸들러가 처리한다. 브라우저 콘솔에 `[MSW] Mocking enabled` 로그가 뜨면 정상.

---

## 프로젝트 구조

```
src/
├── components/       # 공통 UI (Button, Badge, Table, Modal, Toast 등)
├── layouts/          # AppShell (사이드바 + 탑바)
├── pages/            # 화면별 컴포넌트
├── mocks/            # MSW 핸들러 + mock 데이터
├── lib/              # api 클라이언트, 날짜/텍스트 포맷 유틸
├── types/            # domain.ts (Inquiry, Document, LogEvent 등 핵심 타입)
└── styles/           # CSS 커스텀 토큰
```

---

## 문서

| 문서 | 경로 | 내용 |
|---|---|---|
| 기능명세서 | `feature-spec.md` | 기능 ID별 상세 명세, 우선순위, 화면 기준 정리 |
| 레이아웃 와이어프레임 | `hsa_admin_layout.md` | 화면별 텍스트 아트 와이어프레임 |
| Figma 설계 계획 | `docs/figma-design-plan.md` | 디자인 시스템 기초 + Figma 제작 순서 |
