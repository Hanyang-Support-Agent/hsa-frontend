# HSA Figma 디자인 시스템 / 화면 설계안

## 목적

백엔드 개발 전 프론트 PoC 화면을 기준으로 Figma 디자인 시스템과 화면 초안을 만들기 위한 실행 계획이다.
실제 Figma 제작은 파일 URL 또는 fileKey가 준비된 뒤 `figma-generate-library` → `figma-generate-design` 순서로 진행한다.

---

## Foundations

| 구분 | 계획 |
|---|---|
| Color | White/Gray 기반, Green accent, 상태별 의미색(Blue·Amber·Red·Green) |
| Typography | 관리자 콘솔 중심 고가독성 sans-serif, 제목/본문/캡션 3단계 |
| Spacing | 4px base scale: 4, 8, 12, 16, 20, 24, 32, 40 |
| Radius | 6, 10, 14, 16, 20px |
| Shadow | 카드용 soft shadow, focus ring |

---

## 상태값 색상 정의

| 상태값 (`domain.ts`) | 표시명 | 색상 계열 |
|---|---|---|
| `received` | 접수됨 | Gray |
| `classified` | 분류 완료 | Blue |
| `auto_replied` | 자동응답 완료 | Green |
| `draft_ready` | 초안 생성 완료 | Blue |
| `review_required` | 관리자 검토 필요 | Amber |
| `saved` | 임시저장됨 | Gray-Blue |
| `sent` | 발송 완료 | Green (진함) |
| `failed` | 처리 실패 | Red |

---

## Components

| 컴포넌트 | 변형 |
|---|---|
| Button | primary / secondary / ghost / danger × small / medium |
| Input, Select, Textarea | label, hint, focus, disabled, error |
| Badge | 채널(3종) / 문의 유형(4종) / 처리 방식(3종) / 상태(8종) |
| Card | title + description + action slot |
| Table | dense admin data table (정렬·필터 헤더 포함) |
| Sidebar + Topbar | 고정 관리자 셸 |
| Modal | 기본 / 위험(destructive) 확인 |
| Toast | success / error / info |
| EmptyState | 데이터 없음 / 검색 결과 없음 |

---

## 화면 목록

| 화면 | 라우트 | 핵심 내용 |
|---|---|---|
| Login | `/login` | mock 관리자 로그인, PoC 설명 문구 |
| Dashboard | `/dashboard` | 통계 카드 4종(전체·검토필요·자동응답·발송완료) + 최근 처리 로그 테이블 |
| Inquiry List | `/inquiries` | 채널·유형·상태·키워드 필터 + 문의 테이블 |
| Inquiry Detail | `/inquiries/:id` | 원문, 분류/상태 메타, 참고 문서, AI 초안 편집, 임시저장·발송 |
| Logs | `/logs` | 처리 이벤트 이력, 키워드 검색 |
| Documents | `/documents` | 정책·FAQ·상품 문서 등록·목록·삭제, 업로드 모달 |
| Dev Intake | `/dev/intake` | PoC 개발/테스트 전용 — 채널별 mock 문의 주입, 전체 흐름 시뮬레이션 |

---

## Figma 실행 순서

1. 대상 Figma 파일 확인 및 기존 라이브러리/변수/컴포넌트 조사
2. Foundations 변수·스타일 생성 (색상 토큰, 타이포그래피, 간격)
3. 위 컴포넌트 목록을 하나씩 생성하고 screenshot 검수
4. Desktop 1440px 기준 화면을 섹션 단위로 조립
5. 프론트 구현 화면과 비교해 spacing, density, 상태 색상 보정
