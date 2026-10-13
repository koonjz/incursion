# Production Deployment Audit: Vercel + Neon (Serverless PostgreSQL)

**Project:** ACM Resolve  
**Audit Date:** October 2026  
**Auditor:** Senior DevOps Engineer  
**Branch:** `feature/neon-deploy`  

---

## 1. Executive Summary

This audit evaluates the current codebase and deployment readiness for hosting the **ACM Resolve** Next.js application on **Vercel** backed by **Neon Serverless PostgreSQL**.

The project currently runs Next.js 16 (App Router) with Prisma ORM 6 and NextAuth.js. While a solid architectural foundation exists (including RBAC, NextAuth domain guards, and initial migrations), several key adjustments are required to achieve reliable, zero-downtime serverless database operation on Neon and automated CI/CD branch deployments.

In accordance with strict DevOps constraints, **zero pre-existing files will be edited**. All structural additions will be additive, with necessary modifications to existing files documented with exact diffs in `docs/deploy/INTEGRATION_NOTES.md`.

---

## 2. Current State Inventory

### 2.1 Package Scripts (`package.json`)
- **Existing Scripts:**
  - `dev`: `next dev`
  - `build`: `next build`
  - `start`: `next start`
  - `lint`: `eslint`
- **Missing Scripts:**
  - `db:check`: Script to verify database connectivity and latency on both pooled and direct connection strings.
  - `db:migrate:deploy`: Safe migration runner targeting direct connections.
  - `env:verify`: Comprehensive environment variable validation script.
  - `prisma:generate`: Explicit script to generate client artifacts in build pipelines.

### 2.2 Prisma Schema & Migrations (`prisma/`)
- **Datasource Block:**
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
  - **Audit Finding:** The datasource block lacks `directUrl = env("DIRECT_URL")`.
  - **Impact:** Neon uses PgBouncer on port `6543` (or `-pooler` hosts) for runtime connection pooling (`DATABASE_URL`). However, schema migrations (`prisma migrate deploy` or `prisma migrate dev`) require advisory locks and session-level features that fail or hang on connection poolers.
  - **Resolution:** Retain existing `prisma/schema.prisma` intact; provide the exact diff in `INTEGRATION_NOTES.md` and enforce `DIRECT_URL` during migrations via custom shell runner.
- **Existing Migrations:**
  - `prisma/migrations/20261012_m1_init/migration.sql` exists and defines User, Semester, Budget, Event, Expense, and AuditLog tables.
  - Seeding files exist: `prisma/seed-m1.ts` and `prisma/seed-extra.ts`.
  - Missing: Production guard to prevent accidental destructive demo seeding in production environments.

### 2.3 Prisma Client Instantiation
- **Existing Files:**
  - `src/lib/prisma.ts`: Contains a singleton implementation using `globalThis.prismaGlobal`.
  - `lib/backend/prisma.ts` and `lib/backend/conflictEngine.ts`: Direct instances of `new PrismaClient()`.
- **Missing Elements for Neon Serverless:**
  - Cold-start retry logic for Neon compute autosuspend (handling errors `P1001`, `P1002`, `P1017`).
  - Strict connection pooling parameters (`connection_limit=1` for serverless lambdas).
  - Additive singleton client safe for serverless environments in `src/lib/db/prisma-client.ts`.

### 2.4 Health Check Endpoint
- **Existing Route:** `app/api/health/route.ts`
  - Runs `SELECT 1` via `prisma.$queryRawUnsafe('SELECT 1;')`.
  - Measures latency and returns `200` on healthy, `503` on database unreachable.
- **Opportunities for Improvement:**
  - Add commit SHA tracing via `process.env.VERCEL_GIT_COMMIT_SHA`.
  - Add timeout guards to prevent lambdas from hanging on Neon cold starts.
  - Comprehensive unit test suite in Vitest.

### 2.5 Vercel Configuration (`vercel.json`)
- **Existing Configuration:**
  - Specifies `framework: "nextjs"`.
  - Specifies `regions: ["iad1"]` (US East).
  - Specifies `buildCommand: "npx prisma generate && npm run build"`.
- **Audit Finding:**
  - Region `iad1` is in North America. For projects targeting Asian/Indian college deployments, the Neon database should be provisioned in Singapore (`ap-southeast-1` / `aws-ap-southeast-1`), and Vercel functions should be co-located in `sin1` to minimize latency.
  - Missing explicit function `maxDuration` settings for serverless cold-start resilience.

### 2.6 Existing CI/CD Workflows (`.github/workflows/`)
- **Existing Workflows:**
  - `ci.yml`: Runs linter, typecheck, unit tests, and Playwright tests.
  - `deploy-check.yml`: Runs migration check on push to `main` with fallback if secrets are unset.
- **Missing Capabilities:**
  - Ephemeral Neon database branch creation per Pull Request (`preview/pr-<number>`).
  - Automated teardown/cleanup of Neon preview branches when PRs are closed or merged.
  - Dedicated production migration workflow with GitHub Environment protection rules (manual approval), concurrency locking, and post-deploy health smoke test.

### 2.7 Environment Variables & Secrets
- **Existing Templates:** `.env.example.m1` exists.
- **Missing Elements:**
  - Production-specific template (`.env.production.example`) detailing scope differences (Production vs Preview vs Development).
  - Automated validation script verifying URL protocols, pooler flags, SSL modes, and secret lengths.

---

## 3. Gap Analysis Matrix

| Component | Current State | Target Neon + Vercel State | Action Required |
|---|---|---|---|
| **Prisma Datasource** | `url = env("DATABASE_URL")` only | `url = env("DATABASE_URL")` + `directUrl = env("DIRECT_URL")` | Document in `INTEGRATION_NOTES.md` |
| **Serverless Client** | Standard `PrismaClient` singleton | Serverless singleton + retry helper for cold starts | Add `src/lib/db/prisma-client.ts` & `with-retry.ts` |
| **Database Migration** | Unverified connection string | Direct connection only, reject `-pooler` hosts | Add `scripts/db/migrate-deploy.sh` |
| **Connection Check** | None | Pre-flight script validating pooled & direct URLs | Add `scripts/db/check-connection.ts` |
| **Environment Check** | Manual inspection | Automated Zod schema validation script | Add `scripts/db/verify-env.ts` |
| **Preview CI/CD** | Static testing only | Ephemeral Neon database branch per PR | Add `.github/workflows/neon-preview-branch.yml` |
| **Branch Cleanup** | None | Automated branch deletion on PR close | Add `.github/workflows/neon-cleanup-branch.yml` |
| **Production Deploy** | Basic push trigger | Concurrency locked + environment gate + smoke test | Add `.github/workflows/production-migrate.yml` |
| **Production Seeding** | Demo seed script | Guard script blocking production runs | Add `scripts/db/seed-production-guard.ts` |
| **Database Backup** | None | Automated `pg_dump` script with retention notice | Add `scripts/db/backup.sh` |

---

## 4. Implementation Plan

1. **Deliverable 1: Neon Setup Guide** (`docs/deploy/NEON_SETUP.md`)
   - Region selection guidelines (Singapore `ap-southeast-1` co-location).
   - Pooled vs. Direct connection string mechanics.
   - Branching hierarchy (`main`, `dev`, `preview/pr-*`).
   - Free-tier compute autosuspension, cold-start handling, and connection pooling.
   - Least-privilege application roles.
2. **Deliverable 2: Prisma + Neon Configuration**
   - Provide minimal diff in `docs/deploy/INTEGRATION_NOTES.md`.
   - Add `src/lib/db/prisma-client.ts` and `src/lib/db/with-retry.ts` with Vitest test.
   - Add `scripts/db/migrate-deploy.sh`, `scripts/db/check-connection.ts`, `scripts/db/verify-env.ts`.
   - Document optional `@prisma/adapter-neon` architecture.
3. **Deliverable 3: Health Endpoint & Verification**
   - Document enhancements for existing `app/api/health/route.ts` in `INTEGRATION_NOTES.md`.
   - Add unit test suite in `tests/deploy/health.test.ts`.
4. **Deliverable 4: Vercel Configuration**
   - Document `vercel.json` optimizations in `INTEGRATION_NOTES.md`.
   - Add `docs/deploy/VERCEL_SETUP.md` and `.env.production.example`.
5. **Deliverable 5: Google OAuth for Production**
   - Add `docs/deploy/GOOGLE_OAUTH.md` detailing GCP console configuration, redirect URIs, and domain restrictions.
6. **Deliverable 6: CI/CD with Neon Branches**
   - Add `.github/workflows/neon-preview-branch.yml`.
   - Add `.github/workflows/neon-cleanup-branch.yml`.
   - Add `.github/workflows/production-migrate.yml`.
   - Add `docs/deploy/CI_SECRETS.md`.
7. **Deliverable 7: Migration and Data Safety**
   - Add `docs/deploy/MIGRATIONS.md`.
   - Add `scripts/db/backup.sh` and `scripts/db/.gitignore`.
   - Add `scripts/db/seed-production-guard.ts`.
8. **Deliverable 8: Security and Hardening**
   - Add `docs/deploy/HARDENING.md`.
9. **Deliverable 9: Go-Live Runbook**
   - Add `docs/deploy/GO_LIVE_CHECKLIST.md`.
10. **Deliverable 10: Completion Report**
    - Add `docs/deploy/COMPLETION_REPORT.md` confirming zero pre-existing file modifications.
