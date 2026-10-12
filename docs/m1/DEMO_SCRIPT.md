# Milestone 1 Live Demonstration Script (8–10 Minutes)

**Project:** ACM Resolve — Campus Resource & Event Management Platform  
**Presenter:** Team Lead + DevOps + Auth Owner (M1)  
**Target Audience:** Faculty Advisors, Evaluators & Engineering Teammates  

---

## 1. Pre-Demo Checklist (T-Minus 15 Minutes)

- [ ] Confirm local dev server or live production URL is running and responsive.
- [ ] Verify `/api/health` returns `status: "ok"` and database is connected.
- [ ] Seed database if running fresh (`npm run seed:m1` or `npx ts-node prisma/seed-m1.ts`).
- [ ] Open 3 separate browser windows (or 1 regular + 2 incognito windows) to represent the 3 roles:
  - **Window A (ADMIN)**: `admin@university.edu`
  - **Window B (ORGANIZER)**: `organizer@university.edu`
  - **Window C (VIEWER / STUDENT)**: `student@university.edu`
- [ ] Open GitHub Actions tab in repository showing clean green CI run.
- [ ] Have terminal open with `curl` or Postman ready for raw API guard demonstrations.

---

## 2. Timed Demonstration Agenda (9 Minutes Total)

### [00:00 – 01:30] Introduction & Architecture Overview (1.5 min)
- **Action**: Display public landing page (`/`).
- **Talking Points**:
  - *"Welcome everyone. Today I'm presenting Milestone 1 for ACM Resolve. M1 delivers the core enterprise foundations: Google OAuth with strict college domain enforcement, a typed RBAC engine across server components, API routes, and edge middleware, full CI/CD automation, and an administrative management suite."*
  - *"Our stack combines Next.js 16, React 19, Tailwind CSS 4, Prisma with PostgreSQL, and NextAuth with database-synchronized role verification."*

---

### [01:30 – 03:00] Authentication & College Domain Guard (1.5 min)
- **Action**: Navigate to `/login`.
  1. Demonstrate signing in with an authorized campus email: `student@university.edu`.
  2. Explain Google OAuth domain validation (`ALLOWED_EMAIL_DOMAIN="university.edu"`).
  3. Attempt or explain what happens if a personal email (`student@gmail.com`) tries to log in: server-side rejection in the `signIn` callback.
- **Talking Points**:
  - *"Only authenticated campus members are admitted. In our `signIn` callback, we strictly reject unverified accounts and non-campus email domains."*
  - *"New sign-ins automatically default to the lowest tier (`STUDENT / VIEWER`), while emails configured in `INITIAL_ADMIN_EMAILS` are automatically escalated to `ADMIN` upon first access."*

---

### [03:00 – 04:30] RBAC & Edge Route Protection (1.5 min)
- **Action**:
  1. In **Window C (Viewer)**, attempt to navigate directly to `/admin/users`.
  2. Show instant interception by Next.js middleware and redirection to the `/403` Forbidden page.
  3. In Terminal, fire an unauthorized API curl request:
     ```bash
     curl -s -i http://localhost:3000/api/admin/users
     ```
  4. Highlight HTTP 401 response with `{ success: false, error: { code: "UNAUTHORIZED" } }`.
- **Talking Points**:
  - *"Security is enforced at two distinct boundaries: the edge middleware redirects unauthorized browser navigation to a custom 403 page, while our `withRole` wrapper protects API routes, returning consistent, typed JSON responses."*

---

### [04:30 – 06:00] Admin Module: User Management & Real-Time Role Switch (1.5 min)
- **Action**:
  1. Switch to **Window A (Admin)** at `/admin/users`.
  2. Show paginated, searchable user directory.
  3. Promote `student@university.edu` from `STUDENT` to `ORGANIZER`.
  4. Switch back to **Window C (Student)** and refresh: show that role is now `ORGANIZER` immediately **without requiring logout and login**.
  5. Demonstrate **Last-Admin Protection**: attempt to demote the sole remaining admin or self-demote; show rejection toast preventing accidental admin lockout.
- **Talking Points**:
  - *"Our JWT session callback continuously queries the database on token verification, completely eliminating stale token lag. When an admin updates a user's role, the permission changes apply on their very next request."*
  - *"Every role promotion or deactivation is immutably recorded to an `AuditLog` table."*

---

### [06:00 – 07:30] Semester Lifecycle & Date Overlap Prevention (1.5 min)
- **Action**:
  1. Navigate to `/admin/semesters`.
  2. Show existing active semester (`Fall 2026`).
  3. Click **Add Semester** and attempt to create an overlapping term (e.g., `Sep 1, 2026 – Nov 1, 2026`).
  4. Submit form: show instant rejection banner highlighting the mathematical overlap collision.
  5. Create a valid semester (`Spring 2027`: `Jan 10, 2027 – May 15, 2027`) and check **Set as Active**.
  6. Highlight that the database transaction switches `Fall 2026` to inactive, maintaining **exactly one active semester at a time**.
- **Talking Points**:
  - *"We enforce clean temporal integrity using date-fns and SQL interval queries. Two academic terms can never overlap in ACM Resolve, and exactly one term is designated active at any point."*

---

### [07:30 – 09:00] Department Budgets & Visual Utilization Breakdown (1.5 min)
- **Action**:
  1. Navigate to `/admin/budgets`.
  2. Point out KPI summary cards: Total Allocated, Total Spent, Remaining Balance, Utilization %.
  3. Show the visual departmental progress bars.
  4. Click **Add Budget** and attempt to submit an overspend without authorization (Allocated: `$5,000`, Spent: `$7,000`).
  5. Show rejection: *"Spent amount cannot exceed allocated amount without admin override flag."*
  6. Check the **Admin Override** checkbox and resubmit: show successful creation with an `OVERRIDE` badge.
- **Talking Points**:
  - *"Budget limits prevent clubs from overcommitting funds. Only an authorized administrator checking the override flag can permit an overspend."*

---

### [09:00 – 10:00] CI/CD Pipeline & Live Production Verification (1 min)
- **Action**:
  1. Show GitHub Actions tab with the passing CI workflow (Lint, Typecheck, Prisma generate, Vitest, Playwright E2E).
  2. Open browser tab pointing to the live deployment health endpoint: `/api/health`.
  3. Conclude demonstration and open floor for questions.
- **Talking Points**:
  - *"Every pull request runs our full automated test suite against a PostgreSQL container in GitHub Actions before code can be merged into main. Thank you, and I'd be glad to take questions."*

---

## 3. Fallback Plan & Contingencies

| Scenario | Immediate Fallback Action |
|---|---|
| **Google OAuth is down or throttled** | Use the built-in campus credentials provider (`student@university.edu`, `admin@university.edu`) enabled in the login dialog. |
| **Network or Wi-Fi disconnection** | Run the demo against local Docker PostgreSQL at `http://localhost:3000`. All features and guards function offline. |
| **Database seed corrupted** | Run `npx ts-node prisma/seed-m1.ts` to reset users, active semester, and default budgets in 3 seconds. |
