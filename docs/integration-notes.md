# ACM Resolve — Integration Notes & Manual Patch Instructions

In accordance with strict system rules, **zero existing repository files were modified or deleted**.
All new backend logic, database schemas, API routes, modules, tests, and documentation have been placed in clean, new directories.

Follow these step-by-step instructions to integrate the backend with your environment.

---

## 1. NPM Packages to Install

Run the following command in your terminal to install the required backend, database, validation, and testing dependencies:

```bash
npm install @prisma/client zod date-fns next-auth @tanstack/react-query recharts
npm install -D prisma vitest @playwright/test ts-node @types/node
```

### Exact Changes for `package.json`

If adding manually to [package.json](file:///d:/incursion/package.json), add the following lines:

#### Inside `"scripts"`:
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed-extra.ts"
```

#### Inside `"dependencies"`:
```json
    "@prisma/client": "^6.4.0",
    "@tanstack/react-query": "^5.67.0",
    "date-fns": "^4.1.0",
    "next-auth": "^4.24.11",
    "recharts": "^2.15.1",
    "zod": "^3.24.2"
```

#### Inside `"devDependencies"`:
```json
    "@playwright/test": "^1.50.0",
    "prisma": "^6.4.0",
    "ts-node": "^10.9.2",
    "vitest": "^3.0.0"
```

---

## 2. Environment Variables (`.env` / `.env.example`)

Create or update your `.env` file in the project root with the following keys:

```env
# ----------------------------------------------------
# DATABASE (PostgreSQL)
# ----------------------------------------------------
DATABASE_URL="postgresql://postgres:password@localhost:5432/acm_resolve?schema=public"

# ----------------------------------------------------
# NEXTAUTH AUTHENTICATION
# ----------------------------------------------------
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-random-key-at-least-32-chars-long"

# Google OAuth (Optional in local development)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Restricted College Domain (e.g. campus.edu or * to allow all)
ALLOWED_EMAIL_DOMAIN="campus.edu"

# ----------------------------------------------------
# EMAIL NOTIFICATIONS (Resend or Nodemailer)
# ----------------------------------------------------
RESEND_API_KEY=""
EMAIL_FROM="events@campus.edu"

# ----------------------------------------------------
# RECEIPT STORAGE PROVIDER ("cloudinary", "s3", or "mock")
# ----------------------------------------------------
STORAGE_PROVIDER="mock"

# Cloudinary (if STORAGE_PROVIDER=cloudinary)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# AWS S3 (if STORAGE_PROVIDER=s3)
AWS_REGION="us-east-1"
AWS_S3_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
```

---

## 3. Database Migration & Seeding Steps

Once your PostgreSQL database is reachable at `DATABASE_URL`:

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Run Migrations (or push schema directly for quick prototyping):**
   ```bash
   npx prisma migrate dev --name init_backend_models
   ```
   *Or for rapid prototyping without migration history:*
   ```bash
   npx prisma db push
   ```

3. **Execute Idempotent Database Seed:**
   ```bash
   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-extra.ts
   ```
   *Seeder automatically populates:*
   - 1 Administrator, 2 HODs, 5 Organizers, 20 Students
   - 5 Campus Venues
   - 10 Campus Resources
   - 30 Campus Events (including deliberate scheduling clashes)
   - 60 Categorized Expenses & Budgets

---

## 4. Running the Tests

Execute the unit test suite (minimum 20 test specifications covering all conflict engine scenarios, budget aggregation math, receipt validations, and CSV escaping):

```bash
npx vitest run
```

Run Playwright E2E test skeletons:

```bash
npx playwright test
```

---

## 5. Architectural Verification & Safety

- Existing front-end files (`app/page.tsx`, `components/events/EventFormFields.tsx`, `lib/mock/*`) remain intact and functional.
- The new route handlers under `app/api/**` seamlessly connect to the newly created Prisma models and pure conflict engine.
