# HSA Frontend

고객문의 분류/답변 초안 에이전트의 PoC 관리자 콘솔입니다.

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS + CSS design tokens
- React Router
- MSW 기반 mock API

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## PoC Screens

- `/login`: mock 관리자 로그인
- `/dashboard`: 문의 현황 요약
- `/inquiries`: 문의 목록/필터
- `/inquiries/:id`: 문의 상세, AI 초안 수정, 임시저장/발송
- `/logs`: 처리 로그 조회
- `/documents`: 정책/FAQ/상품 문서 mock 관리
- `/dev/intake`: 카카오/인스타/이메일 mock 문의 주입

## Design Docs

- 기능명세: `feature-spec.md`
- 기존 레이아웃 초안: `hsa_admin_layout.md`
- Figma 설계 계획: `docs/figma-design-plan.md`
