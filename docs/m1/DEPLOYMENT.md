# Production Deployment Guide (Vercel + Neon / Supabase)

**Project:** ACM Resolve — Campus Resource & Event Management Platform  
**Target Environments:** Preview (PR branches), Staging (`develop`), Production (`main`)  
**Milestone:** M1 Foundation  

---

## 1. Cloud Database Provisioning (Neon / Supabase PostgreSQL)

ACM Resolve requires a PostgreSQL database instance with connection pooling for serverless execution and direct connections for schema migrations.

### Neon Setup (Recommended):
1. Sign in to [Neon Console](https://console.neon.tech/).
2. Create a project: `acm-resolve-prod`.
3. In **Dashboard > Connection Details**, configure two connection strings:
   - **Pooled Connection (`DATABASE_URL`)**:
     Select **Connection pooling** checkbox (uses PgBouncer on port `5432` or `6543`).
     ```
     postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
     ```
   - **Direct Connection (`DIRECT_URL`)**:
     Uncheck connection pooling (direct unpooled connection).
     ```
     postgresql://username:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

### Supabase Setup (Alternative):
- `DATABASE_URL`: Transaction pooler URL (Port 6543).
- `DIRECT_URL`: Session/direct connection URL (Port 5432).

---

## 2. Google Cloud OAuth 2.0 Credentials

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2. Configure **OAuth Consent Screen**:
   - User Type: **Internal** (if restricted to your Google Workspace campus domain) or **External** with test users.
   - App Name: `ACM Resolve`
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
3. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**.
   - Name: `ACM Resolve Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-production-domain.vercel.app`
     - `https://*.vercel.app` (for preview deployments)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-production-domain.vercel.app/api/auth/callback/google`
4. Copy `Client ID` and `Client Secret`.

---

## 3. Vercel Project Import & Build Settings

1. Connect repository in [Vercel Dashboard](https://vercel.com/new).
2. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `npx prisma generate && npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install --legacy-peer-deps`

---

## 4. Environment Variables Configuration

Set these variables in **Vercel > Project Settings > Environment Variables**:

| Variable Name | Environments | Example Value / Note |
|---|---|---|
| `DATABASE_URL` | Production, Preview | Neon pooled connection string |
| `DIRECT_URL` | Production, Preview | Neon direct connection string |
| `NEXTAUTH_URL` | Production | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Production, Preview | 32-character random string (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Production, Preview | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Production, Preview | From Google Cloud Console |
| `ALLOWED_EMAIL_DOMAIN` | Production, Preview | `university.edu` (campus restriction) |
| `INITIAL_ADMIN_EMAILS` | Production, Preview | `admin@university.edu,dean@university.edu` |
| `RESEND_API_KEY` | Production | Resend email API key |
| `EMAIL_FROM` | Production | `ACM Resolve <notifications@university.edu>` |
| `STORAGE_PROVIDER` | Production, Preview | `cloudinary` or `mock` |
| `CLOUDINARY_CLOUD_NAME`| Production | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Production | Cloudinary API key |
| `CLOUDINARY_API_SECRET`| Production | Cloudinary secret |

> [!TIP]
> For **Preview** environments on Vercel, leave `NEXTAUTH_URL` blank or dynamically configured so NextAuth automatically infers `VERCEL_URL`.

---

## 5. GitHub Actions Secrets Configuration

In your GitHub repository (**Settings > Secrets and variables > Actions**), add:
1. `DATABASE_URL`: Staging / Production DB connection string.
2. `DIRECT_URL`: Unpooled connection string for migrations.

When code merges to `main`, the workflow [.github/workflows/deploy-check.yml](file:///.github/workflows/deploy-check.yml) will safely trigger `npx prisma migrate deploy`.

---

## 6. Deployment Verification & Health Check

After deployment completes:
1. Ping the automated health check:
   ```bash
   curl -i https://your-production-domain.vercel.app/api/health
   ```
   **Expected Response (HTTP 200)**:
   ```json
   {
     "status": "ok",
     "version": "1.0.0-m1",
     "environment": "production",
     "database": {
       "status": "healthy",
       "latencyMs": 42
     }
   }
   ```
2. Verify Google OAuth sign-in with your campus email (`@university.edu`).
3. Verify that non-campus personal Gmail accounts are rejected with an access denied message.
4. Verify `/admin/users`, `/admin/semesters`, and `/admin/budgets` render for the initial admin.

---

## 7. Rollback & Disaster Recovery Strategy

1. **Application Rollback (Vercel Instant Rollback)**:
   - In Vercel Dashboard > **Deployments**, locate the last known healthy deployment.
   - Click the three dots `...` > **Instant Rollback**. Traffic is immediately routed back with zero build delay.
2. **Database Rollback**:
   - Neon provides Point-In-Time Restore (PITR) branches. If a migration causes data corruption, create a branch from 5 minutes prior to the release in the Neon console and point `DATABASE_URL` to the restore branch.
