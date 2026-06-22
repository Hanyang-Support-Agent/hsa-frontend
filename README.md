# HSA Frontend

HSA Frontend는 Hanyang Support Agent의 **AI 고객문의 운영 콘솔**입니다. 운영자는 유입된 고객 문의의 분류 결과, AI 답변 초안, 처리 이력을 한 화면에서 확인하고 최종 답변을 검토·발송할 수 있습니다.

![HSA dashboard backend integration](docs/dashboard-backend-integration.png)

## Overview

- **Backend-integrated console**: Spring 백엔드 API를 기준으로 문의 조회, AI 처리 요청, 답변 수정/확정/발송 흐름을 연결했습니다.
- **Operations dashboard**: 문의 큐, 처리 단계, 운영 타임라인, 채널별 유입 현황을 대시보드에서 요약합니다.
- **Response workflow**: 문의 생성 → AI 처리 → 초안 조회 → 운영자 수정 → 확정/발송까지의 운영 흐름을 지원합니다.
- **API response adapter**: 백엔드 공통 응답 래퍼(`isSuccess/code/message/result`)를 프론트 도메인 모델로 변환합니다.
- **Production deployment**: Vercel 배포 환경에서 AWS ALB 백엔드와 연동되도록 구성했습니다.

## Live URLs

| Target | URL |
|---|---|
| Frontend | https://hsa-frontend-omega.vercel.app |
| Backend Swagger | http://hsa-alb-1734268684.us-east-1.elb.amazonaws.com/swagger-ui/index.html |
| Backend OpenAPI | http://hsa-alb-1734268684.us-east-1.elb.amazonaws.com/api-docs |
| Backend Health | http://hsa-alb-1734268684.us-east-1.elb.amazonaws.com/health |

## Tech Stack

| Area | Stack |
|---|---|
| Framework | React 18, Vite 6, TypeScript 5.7 |
| Routing | React Router 6 |
| Styling | Tailwind CSS 3.4, CSS Custom Properties |
| Icons | Lucide React |
| API | Fetch API, Vite/Vercel rewrite proxy |
| Deployment | Vercel |

## Architecture

```text
Customer Channel
Kakao / Instagram / Email
        │
        ▼
Frontend Admin Console
        │  /api/*
        ▼
Spring Backend
        │  /api/inquiries/process
        ▼
AI Service
        │
        ▼
PostgreSQL / RAG / Processing Logs
```

프론트엔드는 AI 서버를 직접 호출하지 않습니다. AI 처리와 DB/RAG 접근은 백엔드를 통해 수행하며, 브라우저에는 운영 콘솔에 필요한 API만 노출합니다.

## Screens

| Route | Screen | Description |
|---|---|---|
| `/login` | 로그인 | 운영자 콘솔 진입 화면 |
| `/dashboard` | 대시보드 | 문의 큐, 처리 단계, 최근 로그, 채널별 현황 요약 |
| `/inquiries` | 문의 목록 | 채널/유형/상태/키워드 기반 문의 탐색 |
| `/inquiries/:id` | 문의 상세 | 원문, AI 판단 결과, 초안 편집, 임시저장/발송 액션 |
| `/logs` | 처리 기록 | 문의 처리 이벤트 타임라인 조회 |
| `/documents` | 문서 관리 | RAG 문서 관리 UI |
| `/dev/intake` | 문의 접수 테스트 | 개발/시연용 문의 생성 및 AI 처리 트리거 |

## API Integration

| Feature | Backend API | Status |
|---|---|---|
| 문의 목록 조회 | `GET /api/admin/inquiries` | Connected |
| 문의 상세 조회 | `GET /api/admin/inquiries/{id}` | Connected |
| 문의 생성 | `POST /api/inquiries` | Connected |
| AI 처리 요청 | `POST /api/inquiries/{id}/ai-processing` | Connected |
| 답변 수정 | `PATCH /api/admin/responses/{responseId}` | Connected |
| 답변 최종 확정 | `PATCH /api/admin/responses/{responseId}/confirm` | Connected |
| 답변 발송 | `POST /api/admin/responses/{responseId}/send` | Connected |
| 문의별 처리 로그 | `GET /api/admin/inquiries/{id}/logs` | Connected |
| 인증/세션 | - | Planned |
| 문서 업로드/RAG 관리 | - | Planned |

## Deployment Notes

Vercel은 HTTPS로 서비스되고, 현재 백엔드 ALB는 HTTP 엔드포인트를 사용합니다. 브라우저 mixed content 차단을 피하기 위해 Vercel rewrite로 `/api/*` 요청을 백엔드 ALB로 프록시합니다.

```json
{
  "source": "/api/(.*)",
  "destination": "http://hsa-alb-1734268684.us-east-1.elb.amazonaws.com/api/$1"
}
```

검증 완료 항목:

- Vercel 배포 URL에서 대시보드 접근
- AWS ALB 백엔드 health check 응답 확인
- Swagger/OpenAPI 기준 API 계약 확인
- 배포된 프론트에서 실제 백엔드 문의 데이터 조회
- 문의 상세 및 처리 로그 조회

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.example`에는 로컬 개발에 필요한 기본 API 대상과 테스트용 ID가 포함되어 있습니다. 실제 운영 비밀값은 포함하지 않습니다.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Type-check and build production bundle |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Domain States

| Frontend Status | Label | Meaning |
|---|---|---|
| `received` | 접수 | 문의 수집 직후 |
| `classified` | 분류완료 | AI 유형 분류 완료 |
| `auto_replied` | 자동응답 | 자동응답 처리 완료 |
| `draft_ready` | 초안완료 | AI/RAG 초안 준비 완료 |
| `review_required` | 승인필요 | 운영자 검토 필요 |
| `saved` | 임시저장 | 운영자가 최종 답변을 저장한 상태 |
| `sent` | 발송완료 | 최종 답변 발송 완료 |
| `failed` | 실패 | 처리 실패 |

## Project Structure

```text
src/
├── components/       # Shared UI: Button, Badge, Table, Modal, Toast, etc.
├── layouts/          # AppShell navigation and top bar
├── pages/            # Route-level screens
├── lib/              # API client, formatters, metadata helpers
├── types/            # Domain types and labels
└── styles/           # Global styles and design tokens
```

## Related Documents

| Document | Path | Description |
|---|---|---|
| Feature Spec | `feature-spec.md` | 기능 ID별 상세 명세와 우선순위 |
| Wireframe | `hsa_admin_layout.md` | 화면별 텍스트 와이어프레임 |
| Figma Plan | `docs/figma-design-plan.md` | 디자인 시스템 및 Figma 제작 계획 |
