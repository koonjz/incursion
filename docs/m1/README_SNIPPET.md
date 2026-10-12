# README Additions (Milestone 1 — Foundation, DevOps, Auth & RBAC)

*Add the following sections to your repository `README.md` when updating documentation:*

---

```markdown
## Milestone 1: Enterprise Foundations & Access Control

ACM Resolve provides a production-grade authentication and access control layer:

### Key Features
- **Google OAuth 2.0 with Campus Domain Guard**: Strictly enforces `@university.edu` email domains on both the OAuth consent layer and server-side `signIn` callbacks.
- **Three-Tier Role-Based Access Control (RBAC)**:
  - `ADMIN`: Full administrative control over user permissions, semester lifecycles, and departmental budgets.
  - `ORGANIZER`: Authorized to create campus events, request venue resources, and log expenditures.
  - `VIEWER` (`STUDENT`): Read-only attendee access to public schedules and calendars.
- **Edge Middleware Route Protection**: Protects `/admin/**` and `/api/admin/**` with instant redirects to `/403 Forbidden`.
- **Real-Time Session Synchronization**: JWT session callbacks verify active database status on every verification, preventing stale token lag when roles change.
- **Administrative Console**:
  - Searchable user management with self-demotion and last-admin lockout protections.
  - Academic semester management with zero date-overlap enforcement.
  - Department budget tracking with Recharts analytics and overspend controls.
  - Immutable audit logging for all critical system actions.
- **Automated CI/CD Pipeline**: GitHub Actions runs linting, TypeScript compiler checks, Prisma validation, Vitest unit tests, and Playwright E2E suites against a live PostgreSQL service container.

### Local Development Setup

1. **Copy Environment Variables**:
   ```bash
   cp .env.example.m1 .env
   ```

2. **Install Required Packages**:
   ```bash
   npm install @prisma/client prisma next-auth @next-auth/prisma-adapter zod date-fns @tanstack/react-query recharts
   npm install -D vitest @playwright/test ts-node @types/node
   ```

3. **Run Database Migrations & Seed**:
   ```bash
   npx prisma migrate dev --name m1_init
   npx ts-node prisma/seed-m1.ts
   ```

4. **Run Tests**:
   ```bash
   npm run test            # Runs Vitest unit tests
   npx playwright test     # Runs E2E browser tests
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```
```
