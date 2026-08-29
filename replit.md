# 골든 픽 로또 분석 서비스

당첨 기록과 분석 멤버십을 소개하고, 운영팀이 회원·분석 DB·상담 업무를 관리하는 웹 서비스입니다.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- 공개 홈페이지와 어드민 UI: `artifacts/lotto-analysis-home/src`
- 어드민 전용 화면: `artifacts/lotto-analysis-home/src/admin`
- Express API: `artifacts/api-server/src/routes`
- PostgreSQL 스키마: `lib/db/src/schema/index.ts`
- 공개 사이트 스타일: `artifacts/lotto-analysis-home/src/index.css`

## Architecture decisions

- 운영 어드민은 공개 홈페이지와 같은 Vite 앱의 `/admin` 경로에서 제공하되, 전용 컴포넌트와 CSS로 격리합니다.
- 최초 운영자가 `/admin`에서 최고 관리자 계정을 한 번 생성하며, 이후에는 서버 저장 세션 쿠키로 인증합니다.
- 직원·회원·문의·상담 메모·등급·분석 DB·후기는 PostgreSQL에 영속 저장합니다.
- 최고 관리자만 직원 계정과 회원 등급을 변경할 수 있습니다.

## Product

- 공개 사이트: 당첨 후기, 멤버십 안내, 카카오톡 중심 고객센터 문의
- 운영 어드민: 대시보드, 회원 관리, 직원별 분석 DB 배포, 문의 처리와 통화 메모, 직원·등급·후기·통계·계정 설정

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- 어드민을 처음 열면 기본 계정이 아니라 최초 관리자 생성 화면이 표시됩니다.
- DB 스키마 변경 후에는 개발 환경에서 `pnpm --filter @workspace/db run push`를 실행합니다.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
