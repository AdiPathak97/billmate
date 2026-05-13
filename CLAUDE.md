# BillMate — Claude Code Context

## What this project is

GST-compliant invoicing web app for Indian small businesses (product sellers and service providers). Full-stack TypeScript monorepo. Also serves as a portfolio project, so code quality, architecture decisions, and test coverage matter as much as functionality.

## Monorepo structure

```
billmate/
├── apps/
│   ├── web/          Next.js 16 (App Router, ESM, Turbopack)
│   └── api/          Express 4 + TypeScript
├── packages/
│   └── shared/       Types + GST calculation logic (shared by web and api)
├── eslint.config.mjs
├── docker-compose.yml
└── turbo.json
```

## Tech stack

- **Frontend**: Next.js 16.2.6, React 19, Tailwind CSS, TypeScript
- **Backend**: Node.js 24.15.0, Express 4, TypeScript
- **Database**: MongoDB 7 via Mongoose 9.1.6
- **Shared**: TypeScript types + GST utilities in packages/shared
- **Monorepo**: Turborepo + npm workspaces
- **DevOps**: Docker (multi-stage builds), GitHub Actions CI/CD, GHCR

## Critical architectural decisions

- `packages/shared` is the single source of truth for all TypeScript types and GST calculation logic. Never duplicate types between web and api — always import from `@billmate/shared`.
- GST calculation (`calculateTaxSummary`) runs on BOTH frontend (live preview) and backend (before persisting). The backend result is authoritative.
- Every MongoDB document has an `ownerId` field — the app is single-tenant in v1 but architected for multi-tenancy.
- Invoice stores a **snapshot** of the customer at creation time, not just a reference. This is intentional — historical invoices must not be affected by future customer edits.
- Demo user (`isDemo: true`) has hard server-side limits: 10 invoices, 5 customers, 5 PDF downloads. These are enforced in middleware, not just the frontend.

## GST business logic (important — get this right)

- **Intrastate** (seller state code = buyer state code) → CGST + SGST, split equally
- **Interstate** (different state codes) → IGST only
- Supported GST rates: 0%, 5%, 12%, 18%, 28%
- Multi-slab invoices must show breakup per slab
- Invoice number format: `{PREFIX}-{FY}-{SEQUENCE}` e.g. `INV-2425-001`
- Financial year starts April by default (configurable). FY label is `2425` for April 2024 – March 2025.

## Current build phase

**Phase 0 (scaffolding) is complete.** The build sequence is:

- [x] Phase 0 — Monorepo scaffold, shared types, GST utils, Docker, CI/CD
- [ ] Phase 1 — Auth (email/password JWT, demo login)
- [ ] Phase 2 — Business profile (logo, GSTIN, signature upload)
- [ ] Phase 3 — Customer management
- [ ] Phase 4 — Invoice creation (core, no PDF yet)
- [ ] Phase 5 — PDF generation (server-side, GST-compliant layout)
- [ ] Phase 6 — PWA
- [ ] Phase 7 — Demo mode polish
- [ ] Phase 8 — DevOps hardening

## What is explicitly out of scope for v1

- Invoice status / payment tracking (no Draft/Sent/Paid in UI)
- Email sending
- AI/external API dependencies
- Admin panel
- Multi-tenancy (ownerId field exists but unused in v1)
- React Native app

## Dev workflow

```bash
# Start all services locally
docker compose up --build

# Services
# web  → http://localhost:3000
# api  → http://localhost:4000
# health → http://localhost:4000/api/health

# Run from repo root (Turborepo fans out to all workspaces)
npm run dev       # all services in watch mode
npm run build     # build all
npm run lint      # ESLint across all workspaces
npm run test      # Jest across all workspaces
npm run typecheck # tsc --noEmit across all workspaces (shared → api + web in parallel)

# Per workspace
npm run build --workspace=packages/shared   # always build shared first
npm run lint --workspace=apps/api
npm run test --workspace=apps/api -- --passWithNoTests

# Pre-commit hooks run automatically on every commit (via Lefthook):
#   1. prettier --write on staged files (auto re-staged)
#   2. eslint --fix on staged files (auto re-staged)
#   3. turbo run typecheck (shared → api + web in parallel)
#   4. commitlint enforces conventional commit format
# Run npx lefthook install once after cloning to wire up the hooks.

# Before merging / before Docker build — run in this order
npm run lint
npm run typecheck
npm run build --workspace=packages/shared
npm run build --workspace=apps/api
npm run build --workspace=apps/web
docker buildx build --file apps/api/Dockerfile --tag billmate/api:local --no-cache .
docker buildx build --file apps/web/Dockerfile --tag billmate/web:local --no-cache .
```

## Pre-commit hooks

Managed by [Lefthook](https://lefthook.dev). Config in `lefthook.yml` at root.

- **pre-commit (priority 1, parallel)**: `prettier --write` + `eslint --fix` on staged files; both re-stage via `stage_fixed: true`
- **pre-commit (priority 2)**: `turbo run typecheck` — full workspace type-check (`packages/shared` first, then `apps/api` + `apps/web` in parallel). `cache: false` in `turbo.json` ensures this never skips due to stale cache.
- **commit-msg**: `commitlint` enforces conventional commit format

Lefthook was chosen over Husky+lint-staged because tRPC router type changes in `apps/api` propagate to client types in `apps/web` — `tsc --noEmit` must run on the full workspace, not just staged files.

Hooks auto-skip in CI (`CI=true`). New contributors must run `npx lefthook install` once after cloning.

## Conventions

- **Commits**: conventional commits — `feat:`, `fix:`, `chore:`, `test:`, `refactor:` (enforced by commitlint)
- **Branches**: feature branches off `main`, PRs required
- **TypeScript**: strict mode, no `any` without comment justification
- **Tests**: test files in `src/__tests__/`, named `*.test.ts` or `*.test.tsx`
- **API responses**: always use `ApiSuccess<T>` or `ApiError` shape from `@billmate/shared`
- **Error handling**: throw `AppError` (from `apps/api/src/middleware/errorHandler.ts`) for known errors; never let unknown errors leak to the client

## Environment variables

See `.env.example` at root. Required to run:

- `MONGO_URI`
- `JWT_ACCESS_SECRET` (min 16 chars)
- `JWT_REFRESH_SECRET` (min 16 chars)

All env vars are validated at startup via Zod in `apps/api/src/config/env.ts` — the server will refuse to start with missing or invalid vars.

## Known deferred issues (do not fix prematurely)

- `jest-environment-jsdom@29.7.0` has a known vulnerability chain via `@tootallnate/once` → `jsdom`. This is a test-only dependency. Upgrade blocked on `ts-jest` releasing Jest 30 support. Track before shipping to production.
- `typescript-eslint` and `@types/jest` are not using caret ranges intentionally — pinned for cross-environment consistency between local, CI, and Docker.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

- **On PR**: lint + type-check + test (all workspaces)
- **On merge to main**: above + Docker build and push to GHCR
- Node version pinned to `24.15.0` in workflow to match Dockerfiles
- Docker images pushed to `ghcr.io/adipathak97/billmate/api:latest` and `.../web:latest`
- Registry-based Docker layer caching enabled

## Package version policy

All production-critical packages are pinned to exact versions (no `^`) to prevent environment drift between local, CI runner, and Docker. When upgrading a package: update `package.json`, run `npm install`, commit both `package.json` and `package-lock.json` together.
