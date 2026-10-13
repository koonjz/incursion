# Production Go-Live Runbook & Verification Checklist

**Application:** ACM Resolve  
**Target Environment:** Vercel Production + Neon Serverless PostgreSQL  
**Document Version:** 1.0.0  

---

## 1. Ordered Go-Live Checklist

Complete each verification step in order before opening ACM Resolve to end users:

- [ ] **a. Neon Project & Branch Setup**
  - Project provisioned in AWS Singapore (`ap-southeast-1`) or nearest user region.
  - PostgreSQL version 16+ active.
  - Branches created: `main` (production) and `dev` (staging/dev).
  - Pooled connection string copied (contains `-pooler`, port `6543`, `sslmode=require`).
  - Direct connection string copied (no `-pooler`, port `5432`, `sslmode=require`).
  - Restricted role `acm_app` created for runtime; `neondb_owner` reserved for migrations.

- [ ] **b. Environment Variables in Vercel**
  - All Production and Preview variables populated per `.env.production.example`.
  - `DATABASE_URL` points to pooled connection with `&pgbouncer=true&connect_timeout=15`.
  - `DIRECT_URL` points to direct unpooled connection.
  - `NEXTAUTH_URL` set to canonical HTTPS URL without trailing slash (e.g. `https://acm-resolve.yourcollege.edu`).
  - `NEXTAUTH_SECRET` generated with `openssl rand -base64 32` (32+ characters).
  - `ALLOWED_EMAIL_DOMAIN` set to institutional domain (e.g. `yourcollege.edu`).
  - `INITIAL_ADMIN_EMAILS` populated with initial admin addresses.

- [ ] **c. Local Pre-Flight Verification**
  - `npm run env:verify` (or `npx tsx scripts/db/verify-env.ts`) passes with `[PASS]` on all variables.
  - `npx tsx scripts/db/check-connection.ts` reports successful connection and latency for both pooled and direct endpoints.

- [ ] **d. Database Migrations Applied**
  - Migrations deployed to production `main` branch via GitHub Actions workflow `.github/workflows/production-migrate.yml` or manual invocation of `scripts/db/migrate-deploy.sh`.
  - All migrations verified in `_prisma_migrations` table.

- [ ] **e. Google OAuth 2.0 Console Configured**
  - OAuth consent screen configured as **Internal** (Google Workspace) or verified External.
  - Authorized JavaScript Origins includes production URL (e.g. `https://acm-resolve.yourcollege.edu`).
  - Authorized Redirect URIs includes exact callback endpoint: `https://acm-resolve.yourcollege.edu/api/auth/callback/google`.

- [ ] **f. Initial Vercel Production Deployment Succeeded**
  - Build command completed: `prisma generate && next build`.
  - Zero build warnings or broken dynamic route exports.
  - Custom domain DNS records propagated and Let's Encrypt SSL active.

- [ ] **g. Health Check Verification (`/api/health`)**
  - `curl -i https://acm-resolve.yourcollege.edu/api/health` returns HTTP `200 OK`.
  - JSON payload contains `status: "ok"` and `database: { status: "healthy" }`.
  - Database latency is measured and reported under 100ms.

- [ ] **h. Google OAuth & Domain Restriction Smoke Test**
  - Log in with valid college email (`user@yourcollege.edu`): successful redirect to Dashboard.
  - Attempt login with personal consumer account (`user@gmail.com`): rejected with `AccessDenied` or domain error.

- [ ] **i. Initial Admin Bootstrap & Role Promotion**
  - User with email listed in `INITIAL_ADMIN_EMAILS` signs in.
  - Verify user is assigned `role: "ADMIN"` in database.
  - Admin navigates to `/admin/roles` and successfully updates a test user's role.

- [ ] **j. RBAC Authorization Gate Verification**
  - Authenticate as a standard non-admin user (e.g. `STUDENT` or `ORGANIZER`).
  - Navigate to `/admin` or attempt `GET /api/admin/users`: correctly blocked with HTTP `403 Forbidden` or redirected.

- [ ] **k. Email & Attachment Upload Verification**
  - Submit a test event with attachment/receipt flyer: file successfully stored in Cloudinary / S3.
  - Trigger approval workflow notification: email received via Resend / SMTP.

- [ ] **l. Pre-Demo Cold-Start Warm-Up**
  - Prior to stakeholder demonstrations or heavy traffic periods, send a ping to `/api/health` to ensure Neon compute is awake and ready.

- [ ] **m. Emergency Rollback Plan Validated**
  - Vercel Instant Rollback accessible via Deployments tab.
  - Neon Point-in-Time Restore (PITR) verified in console for 24-hour instant time travel recovery.

---

## 2. Production Troubleshooting Matrix

| Symptom | Probable Cause | Immediate Remediation |
|---|---|---|
| **`P1001: Can't reach database server`** | Neon compute node was autosuspended and client timeout expired before it finished waking up. | Append `&connect_timeout=15` to `DATABASE_URL` and `DIRECT_URL`. Wrap query in `withDbRetry()`. |
| **`Too many connections` / Connection limit exceeded** | Serverless functions opening unpooled connections or too many concurrent lambdas. | 1. Ensure `DATABASE_URL` contains `-pooler` (PgBouncer).<br>2. Append `&connection_limit=1` to `DATABASE_URL`.<br>3. Verify `prismaClient` singleton is used. |
| **`SSL connection error` / `self-signed certificate`** | Connection string is missing mandatory TLS/SSL enforcement parameters. | Append `?sslmode=require` to both `DATABASE_URL` and `DIRECT_URL`. |
| **Login Loop / Returning to sign-in page** | NextAuth secure cookie rejection or canonical domain mismatch. | 1. Ensure `NEXTAUTH_URL` uses `https://` without trailing slash.<br>2. Clear browser cookies and test in Incognito window. |
| **`redirect_uri_mismatch` (Error 400)** | The redirect URI sent by NextAuth does not match the Google Cloud Console credentials byte-for-byte. | Copy the exact URL from the Google error screen and add it to **Authorized Redirect URIs** in Google Cloud Console. |
| **First request of the day is slow (3–5s)** | Normal Neon compute cold-start wake-up from scale-to-zero. | Normal behavior on Free tier. Mitigate by curling `/api/health` 1 minute prior to demonstrations. |
| **Migration lock timeout / Hangs on `prisma migrate deploy`** | Migration was executed against pooled connection (`-pooler`), which breaks advisory locking. | Ensure migrations strictly run against `DIRECT_URL` via `scripts/db/migrate-deploy.sh`. |
| **Build fails on `Prisma Client not found`** | Vercel build did not run `prisma generate` prior to Next.js compilation. | Set Vercel Build Command to `prisma generate && next build`. |
