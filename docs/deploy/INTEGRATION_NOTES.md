# Production Deployment: Integration Notes & Minimal Diffs

**Project:** ACM Resolve  
**Purpose:** Exact minimal modifications required on pre-existing files to enable production deployment on Vercel with Neon Serverless PostgreSQL.  
**Strict Policy:** Per project constraints, these existing files have NOT been modified automatically by the agent. A human developer must review and apply these exact diffs.

---

## 1. `prisma/schema.prisma` — Direct URL for Migrations

### Why this is needed:
Neon requires connection pooling via PgBouncer for serverless application runtimes (`DATABASE_URL`), but Prisma schema migrations require session-level locking and transaction isolation that fails over connection poolers. Adding `directUrl` instructs Prisma CLI to execute migrations through the direct, unpooled connection (`DIRECT_URL`).

### Location:
`prisma/schema.prisma` lines 1–4

### Diff:
```diff
 datasource db {
   provider  = "postgresql"
   url       = env("DATABASE_URL")
+  directUrl = env("DIRECT_URL")
 }
```

---

## 2. `package.json` — Database and Deployment Scripts

### Why this is needed:
Adds automated pre-flight checks, environment validation, safe migration execution, and explicit Prisma client generation commands into standard npm lifecycle scripts.

### Location:
`package.json` under `"scripts"` block (around lines 5–10)

### Diff:
```diff
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
-    "lint": "eslint"
+    "lint": "eslint",
+    "prisma:generate": "prisma generate",
+    "db:check": "tsx scripts/db/check-connection.ts",
+    "db:migrate:deploy": "bash scripts/db/migrate-deploy.sh",
+    "env:verify": "tsx scripts/db/verify-env.ts"
   },
```

---

## 3. `vercel.json` — Region Co-Location & Function Duration

### Why this is needed:
- Co-locating Vercel Functions in Singapore (`sin1`) with Neon Singapore (`ap-southeast-1`) eliminates cross-continent latency.
- Increasing function `maxDuration` to 15 seconds prevents serverless timeouts during initial cold-start compute spin-up on Neon free tier.

### Location:
`vercel.json` top-level keys

### Diff:
```diff
 {
   "$schema": "https://openapi.vercel.sh/vercel.json",
   "framework": "nextjs",
-  "buildCommand": "npx prisma generate && npm run build",
-  "regions": ["iad1"],
+  "buildCommand": "prisma generate && next build",
+  "regions": ["sin1"],
+  "functions": {
+    "app/api/**/*": {
+      "maxDuration": 15
+    }
+  },
   "headers": [
```

---

## 4. Prisma Client Singleton Harmonization

### Current State:
Three separate files currently instantiate `new PrismaClient()`:
1. `src/lib/prisma.ts`
2. `lib/backend/prisma.ts`
3. `lib/backend/conflictEngine.ts`

### Target State:
Consolidate all database access to use the serverless-safe singleton at `src/lib/db/prisma-client.ts`.

#### A. In `src/lib/prisma.ts`:
```diff
-import { PrismaClient } from "@prisma/client";
-
-declare global {
-  var prismaGlobal: PrismaClient | undefined;
-}
-
-export const prisma: PrismaClient =
-  globalThis.prismaGlobal ??
-  new PrismaClient({
-    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
-  });
-
-if (process.env.NODE_ENV !== "production") {
-  globalThis.prismaGlobal = prisma;
-}
-
-export default prisma;
+import { prismaClient } from "./db/prisma-client";
+export const prisma = prismaClient;
+export default prismaClient;
```

#### B. In `lib/backend/prisma.ts`:
```diff
-import { PrismaClient } from "@prisma/client";
-export const prisma = new PrismaClient();
+import { prismaClient } from "@/src/lib/db/prisma-client";
+export const prisma = prismaClient;
+export default prisma;
```

#### C. In `lib/backend/conflictEngine.ts`:
```diff
-import { PrismaClient } from "@prisma/client";
+import { prismaClient } from "@/src/lib/db/prisma-client";
-export const prisma = new PrismaClient();
+export const prisma = prismaClient;
```

---

## 5. Health Check Endpoint (`app/api/health/route.ts`) Improvements

### Current State:
The existing health route at `app/api/health/route.ts` already executes `SELECT 1` and returns `200` or `503`.

### Recommended Additions:
Incorporate deployment commit tracking via `VERCEL_GIT_COMMIT_SHA` and set a 5-second query timeout to fail fast on cold-start stalls:

### Diff:
```diff
     const pingStart = Date.now();
-    await prisma.$queryRawUnsafe(`SELECT 1;`);
+    await Promise.race([
+      prisma.$queryRawUnsafe(`SELECT 1;`),
+      new Promise((_, reject) => setTimeout(() => reject(new Error("Database query timed out")), 5000))
+    ]);
     dbLatencyMs = Date.now() - pingStart;
```
And include git commit in the JSON payload:
```diff
       status: isHealthy ? "ok" : "degraded",
       timestamp: new Date().toISOString(),
-      version: "1.0.0-m1",
+      version: "1.0.0-m1",
+      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || "local-dev",
       environment: process.env.NODE_ENV || "development",
```

---

## 6. Optional: `@prisma/adapter-neon` Migration Steps

If you choose to run API routes on Vercel's Edge runtime in the future:
1. Install dependencies:
   ```bash
   npm install @prisma/adapter-neon @neondatabase/serverless ws
   npm install --save-dev @types/ws
   ```
2. Enable preview feature in `prisma/schema.prisma`:
   ```prisma
   generator client {
     provider        = "prisma-client-js"
     previewFeatures = ["driverAdapters"]
   }
   ```
3. Update `src/lib/db/prisma-client.ts`:
   ```typescript
   import { Pool, neonConfig } from "@neondatabase/serverless";
   import { PrismaNeon } from "@prisma/adapter-neon";
   import { PrismaClient } from "@prisma/client";
   import ws from "ws";

   neonConfig.webSocketConstructor = ws;
   const connectionString = process.env.DATABASE_URL!;
   const pool = new Pool({ connectionString });
   const adapter = new PrismaNeon(pool);
   export const prisma = new PrismaClient({ adapter });
   ```
