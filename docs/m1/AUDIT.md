# M1 Audit & Architecture Plan

**Project:** ACM Resolve — Campus Resource & Event Management Platform  
**Owner:** Team Lead + DevOps + Auth Owner (M1)  
**Branch:** `feature/m1-foundation`  
**Date:** October 2026  

---

## 1. Executive Summary & Repository Audit

An audit of the codebase was conducted prior to implementing Milestone 1 (M1). The repository is a hybrid monostructure containing a modern Next.js 16 (React 19) frontend and recently added Next.js API route handlers with Prisma ORM and Vitest configurations.

### 1.1 Existing Assets
1. **Frontend Architecture (`app/`, `components/`)**:
   - Next.js App Router structure with route groups `app/(app)` for authenticated features (`/dashboard`, `/calendar`, `/events`, `/verification`) and public routes (`/`, `/login`).
   - Rich custom design system in `app/globals.css` (Tailwind 4, Radix primitives, glassmorphism, responsive navigation).
   - Component organization: `components/auth`, `components/calendar`, `components/conflicts`, `components/events`, `components/landing`, `components/shared`, `components/shell`, `components/ui`, `components/verification`.

2. **Backend & Domain Architecture (`app/api/`, `src/`)**:
   - `src/config/index.ts`: Centralized `APP_CONFIG` managing environment variables for auth, storage, email, and conflicts.
   - `src/lib/prisma.ts`: Global singleton instance of `PrismaClient`.
   - `src/modules/auth/`: Contains `authOptions.ts` (Credentials + Google stub) and `rbac.ts` (defining `UserRole = "ADMIN" | "HOD" | "ORGANIZER" | "STUDENT"` and initial `getCurrentUser`, `requireAuth`, `requireRole`).
   - `app/api/auth/[...nextauth]/route.ts`: Existing NextAuth route handler importing from `src/modules/auth/authOptions`.
   - Domain modules under `src/modules/`: `archive`, `budget`, `conflicts`, `events`, `expenses`, `notifications`, `receipts`, `reports`.
   - API endpoints under `app/api/`: `archive/search`, `budget/*`, `events/*`, `expenses/*`, `receipts/*`, `reports/*`.

3. **Database & Schema (`prisma/schema.prisma`)**:
   - Database: PostgreSQL (configured via `DATABASE_URL`).
   - Enums: `Role` (`ADMIN`, `HOD`, `ORGANIZER`, `STUDENT`), `EventStatus`, `ConflictType`, `Severity`, `ExpenseCategory`, `ExpenseStatus`.
   - Existing Models: `User`, `Venue`, `Resource`, `Event`, `EventResource`, `ConflictLog`, `Review`, `Budget`, `Expense`, `Receipt`, `Notification`.
   - Missing from Schema: `Semester`, `AuditLog`, `Account`, `Session`, `VerificationToken`, and `isActive` flag on `User`.

4. **Testing & CI Configuration**:
   - Vitest config in root: `vitest.config.ts` targeting `tests/**/*.test.ts` with alias `@` pointing to `./`.
   - Existing test directories: `tests/backend`, `tests/conflicts`, `tests/e2e`.
   - Missing: GitHub Actions workflows (`.github/` does not exist), E2E test server setup for CI, Playwright config.

5. **Middleware & Routing Guards**:
   - No `middleware.ts` or `src/middleware.ts` currently exists in the repository.

---

## 2. Role Model Analysis & Assumption

### Existing Roles in Codebase:
- `prisma/schema.prisma`: `enum Role { ADMIN, HOD, ORGANIZER, STUDENT }`
- `src/modules/auth/rbac.ts`: `type UserRole = "ADMIN" | "HOD" | "ORGANIZER" | "STUDENT"`

### Canonical M1 3-Role Alignment:
To satisfy both the M1 specification (which requires **ADMIN**, **ORGANIZER**, **VIEWER**) and maintain 100% backward compatibility with pre-existing models and tests that utilize `STUDENT`:
1. **ADMIN**: Superuser / College Dean / Tech Administrator. Full access to `/admin`, system configuration, user role promotion, semester lifecycle, budget allocation, and audit logs.
2. **ORGANIZER**: Club leads, faculty event heads, student council organizers. Can create events, submit booking requests, manage assigned club budgets and upload expense receipts.
3. **VIEWER (STUDENT)**: Read-only student / attendee access. Can view public schedules, published calendars, and RSVP to events. Has zero access to administrative controls or event submission drafts.
*(Note: `HOD` in the existing schema is treated as an elevated departmental reviewer/organizer, with permission to approve events in their department).*

The M1 RBAC engine will support `VIEWER` as the canonical read-only role, aliased with `STUDENT` so existing database rows and code referencing `STUDENT` continue to work without disruption.

---

## 3. What is Missing for M1

| Area | Missing Item | Strategy |
|---|---|---|
| **CI/CD** | `.github/workflows/ci.yml`, `deploy-check.yml`, PR template, issue templates, CODEOWNERS | Create standard enterprise GitHub Actions pipelines with caching, lint, typecheck, Prisma validation, Vitest, and Playwright jobs. |
| **Branching** | `/docs/m1/BRANCHING.md` | Establish team branch strategy, commit conventions (Conventional Commits), PR requirements, and protection rules. |
| **Environment** | `.env.example.m1` | Provide comprehensive template covering DB, NextAuth, Google OAuth, college domain filter, initial admins, email, and storage. |
| **Auth** | Domain restriction hint + verification, initial admin bootstrap, session DB role refresh, `next-auth.d.ts`, `/403` page, deactivated user banner | Implement in `src/lib/auth/*`, custom `/403` error page, and provide `src/providers/auth-provider.tsx` for client apps. |
| **RBAC** | Central permission matrix, `requireAuth`, `requireRole`, `withRole` API wrapper with Zod validation, `middleware-guard.ts`, `<RoleGate>`, `useRole()`, role-based navigation | Implement cleanly in `src/lib/rbac/` and `src/components/auth/RoleGate.tsx`. Since no root `middleware.ts` exists, create it using our modular guard. |
| **Admin Module** | `/admin/users`, `/admin/semesters`, `/admin/budgets`, `/api/admin/*` | Build complete responsive management suite under `app/admin/` and `app/api/admin/` with Recharts visualization, Zod schemas, date-fns overlap detection, and audit logging. |
| **Database Additions** | `Semester`, `AuditLog`, `Account`, `Session`, `VerificationToken`, `isActive` | Provide additive models in `docs/m1/schema-additions.prisma` and Prisma migration SQL without modifying `prisma/schema.prisma`. |
| **Seed Data** | `prisma/seed-m1.ts` | Standalone seeder populating initial admin, organizer, student/viewer, active semester, sample budgets, and audit logs. |
| **Health Check** | `/api/health` | Add endpoint verifying database connection and application status. |
| **Documentation** | `DEPLOYMENT.md`, `DEMO_SCRIPT.md`, `INTEGRATION_GUIDE.md`, `PLAN.md`, `README_SNIPPET.md`, `INTEGRATION_NOTES.md` | Comprehensive guides for team members, DevOps deployment, and 10-minute demo script. |
| **Tests** | Vitest unit tests (`tests/m1/*.test.ts`) & Playwright E2E (`tests/m1/e2e/*.spec.ts`) | Comprehensive test suites testing RBAC, permission matrix, semester overlaps, budget constraints, and role demotion safety. |

---

## 4. Implementation Plan & Order of Operations

1. **Phase 1: Repo + CI/CD + Branching + Environment**
   - `.github/workflows/ci.yml` & `.github/workflows/deploy-check.yml`
   - `.github/pull_request_template.md`, `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/*`
   - `docs/m1/BRANCHING.md`
   - `.env.example.m1`
2. **Phase 2: Auth & RBAC Core Engines**
   - `src/types/next-auth.d.ts` (type augmentation)
   - `src/lib/auth/options.ts` & `src/lib/auth/domain-guard.ts`
   - `src/lib/rbac/permissions.ts` (central typed matrix)
   - `src/lib/rbac/server-guard.ts` (`requireAuth`, `requireRole`, `withRole`)
   - `src/lib/rbac/middleware-guard.ts` and `middleware.ts`
   - `src/providers/auth-provider.tsx` (SessionProvider + TanStack Query)
   - `src/components/auth/RoleGate.tsx` & `src/hooks/useRole.ts`
   - `src/config/nav-config.ts` (Role-based navigation item registry)
   - `app/403/page.tsx` (Accessible 403 Forbidden page)
3. **Phase 3: Database Models & Additive Schemas**
   - `docs/m1/schema-additions.prisma`
   - `prisma/migrations/20261012_m1_init/migration.sql`
   - `prisma/seed-m1.ts`
4. **Phase 4: Admin API Handlers & Validation**
   - `src/lib/validation/admin.ts` (Zod schemas for users, semesters, budgets)
   - `app/api/admin/users/route.ts` (GET paginated, PATCH role/status with last-admin guard & audit log)
   - `app/api/admin/semesters/route.ts` (GET, POST with overlap validation & single active transaction)
   - `app/api/admin/semesters/[id]/route.ts` (PATCH, DELETE with safety check)
   - `app/api/admin/budgets/route.ts` (GET with aggregation, POST with spent <= allocated check)
   - `app/api/admin/budgets/[id]/route.ts` (PATCH, DELETE)
   - `app/api/health/route.ts` (Database connectivity probe)
5. **Phase 5: Admin UI Pages (Shadcn UI + Recharts + date-fns)**
   - `app/admin/layout.tsx` (Admin dashboard navigation & breadcrumbs)
   - `app/admin/users/page.tsx` (User & role management table)
   - `app/admin/semesters/page.tsx` (Semester CRUD & overlap prevention)
   - `app/admin/budgets/page.tsx` (Budget tracking & Recharts visualization)
6. **Phase 6: Testing Suite**
   - Vitest unit tests in `tests/m1/`
   - Playwright E2E specs in `tests/m1/e2e/`
7. **Phase 7: Deployment & Team Documentation**
   - `docs/m1/DEPLOYMENT.md`
   - `docs/m1/DEMO_SCRIPT.md`
   - `docs/m1/INTEGRATION_GUIDE.md`
   - `docs/m1/PLAN.md`
   - `docs/m1/README_SNIPPET.md`
   - `docs/m1/INTEGRATION_NOTES.md`
   - `docs/m1/COMPLETION_REPORT.md`
