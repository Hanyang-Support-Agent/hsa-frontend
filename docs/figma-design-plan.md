# HSA Figma 디자인 시스템 / 화면 설계안

## 목적

백엔드 개발 전 프론트 PoC 화면을 기준으로 Figma 디자인 시스템과 화면 초안을 만들기 위한 실행 계획이다. 실제 Figma 제작은 파일 URL 또는 fileKey가 준비된 뒤 `figma-generate-library` → `figma-generate-design` 순서로 진행한다.

## Foundations

| 구분 | 계획 |
| --- | --- |
| Color | White/Gray 기반, Green accent, Blue/Amber/Red 상태 색상 |
| Typography | 관리자 콘솔 중심의 고가독성 sans-serif, 제목/본문/캡션 3단계 |
| Spacing | 4px base scale: 4, 8, 12, 16, 20, 24, 32, 40 |
| Radius | 6, 10, 14, 16, 20px |
| Shadow | 카드용 soft shadow, focus ring |
| Status | 접수, 분류완료, 자동응답, 초안완료, 승인필요, 임시저장, 발송완료, 실패 |

## Components

- Button: primary, secondary, ghost, danger / small, medium
- Input, Select, Textarea: label, hint, focus, disabled
- Badge: channel, inquiry type, processing mode, status
- Card: title, description, action slot
- Table: dense admin data table
- Sidebar, Topbar: fixed admin shell
- Modal: destructive confirmation
- Toast: success/error feedback
- EmptyState: no data/search empty

## Screens

| 화면 | 기준 |
| --- | --- |
| Login | Mock 관리자 로그인, PoC 설명 |
| Dashboard | 전체 문의/승인필요/자동응답/발송완료 지표, 최근 문의/로그 |
| Inquiry List | 채널/유형/상태/search 필터와 문의 테이블 |
| Inquiry Detail | 원문, 분류/상태 메타, 근거 문서, AI 초안 편집, 임시저장/발송 |
| Logs | 처리 이벤트와 상태 변화 추적 |
| Documents | 정책/FAQ/상품 문서 mock 등록·삭제 |
| Dev Intake | 실제 채널 연동 전 mock 문의 주입 |

## Figma 실행 순서

1. 대상 Figma 파일 확인 및 기존 라이브러리/변수/컴포넌트 조사
2. Foundations 변수/스타일 생성
3. 위 컴포넌트 목록을 하나씩 생성하고 screenshot 검수
4. Desktop 1440px 기준 화면을 섹션 단위로 조립
5. 프론트 구현 화면과 비교해 spacing, density, 상태 색상 보정
