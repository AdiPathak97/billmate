# BillMate

GST-compliant invoicing for Indian small businesses. Built for product sellers and service providers — create professional tax invoices, manage customers, and download GST-ready PDFs.

Live demo: _coming soon_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6 (App Router), Tailwind CSS, TypeScript |
| Backend | Node.js 24.15.0, Express, TypeScript |
| API layer | tRPC (business logic) + Express REST (auth) |
| Database | MongoDB (Mongoose) |
| Shared | TypeScript types + GST calculation logic |
| DevOps | Docker, GitHub Actions |

Monorepo managed with [Turborepo](https://turbo.build) and npm workspaces.

---

## Project Structure

```
billmate/
├── apps/
│   ├── web/          Next.js frontend
│   └── api/          Express API (REST for auth, tRPC for business logic)
├── packages/
│   └── shared/       Shared TypeScript types and GST utilities
├── docker-compose.yml
└── .github/
    └── workflows/    CI/CD pipeline
```

---

## Getting Started

### Prerequisites
- Node.js 24.15.0 (matches Dockerfiles and CI)
- Docker + Docker Compose

### Local Development

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/your-username/billmate.git
cd billmate
npm install
```

2. Install git hooks (one-time, required):

```bash
npx lefthook install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env and fill in JWT secrets
```

4. Start all services:

```bash
docker compose up --build
```

| Service      | URL                              |
| ------------ | -------------------------------- |
| Frontend     | http://localhost:3000            |
| API          | http://localhost:4000            |
| Health check | http://localhost:4000/api/health |

---

## Environment Variables

See `.env.example` for the full list. Required before running:

```
MONGO_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
```

---

## Features (v1)

- [x] Project scaffolding and monorepo setup
- [ ] Authentication (email + password, JWT)
- [ ] Business profile (logo, GSTIN, signature)
- [ ] Customer management
- [ ] Invoice creation with live GST calculation (CGST/SGST/IGST)
- [ ] Self-building item master (auto-populated through invoice use)
- [ ] PDF generation (GST-compliant Tax Invoice layout)
- [ ] Demo mode (sandboxed, watermarked, usage-limited)
- [ ] PWA (installable from browser)
- [ ] CI/CD (GitHub Actions → Docker → deploy)

---

## GST Logic

The shared package (`packages/shared`) contains all GST calculation logic:

- **Intrastate** (seller state = buyer state) → CGST + SGST, split equally
- **Interstate** (seller state ≠ buyer state) → IGST
- Supports all GST slabs: 0%, 5%, 12%, 18%, 28%
- Multi-slab invoices handled correctly (breakup per slab)
- Financial year detection for invoice numbering (default FY start: April)

This logic runs on both frontend (live preview) and backend (before persisting) — single source of truth.

---

## Commit Conventions

This repo uses [Conventional Commits](https://www.conventionalcommits.org/), enforced by `commitlint` on every commit:

```
feat: add customer search
fix: correct IGST calculation for interstate invoices
chore: upgrade dependencies
test: add unit tests for GST utils
refactor: extract invoice number generator
```

Pre-commit hooks (via [Lefthook](https://lefthook.dev)) also auto-format staged files with Prettier and run ESLint before every commit. Full TypeScript type-checking runs across all workspaces to catch cross-package type errors before they land.

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

- **On pull request** → lint, type-check, build
- **On merge to main** → all of the above + Docker image build and push to GHCR

---

## Roadmap (Post v1)

- Invoice status and payment tracking
- Email delivery (invoice as PDF attachment)
- Admin panel
- Multi-tenant support
- Quotations → convert to Invoice
- Expense tracking and revenue reports
- React Native app
- Razorpay payment link on invoice
