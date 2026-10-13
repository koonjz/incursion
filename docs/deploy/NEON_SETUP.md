# Neon Serverless PostgreSQL Setup Guide

**Target Environment:** Production & Preview Hosting for ACM Resolve  
**Database Provider:** [Neon](https://neon.tech)  
**Database Engine:** PostgreSQL 16+ (Serverless)  

---

## 1. Project Creation & Region Selection

1. Log in to the [Neon Console](https://console.neon.tech/).
2. Click **Create Project**.
3. **Project Name:** `acm-resolve-prod` (or your preferred organization name).
4. **Postgres Version:** Select **PostgreSQL 16** (or the latest available stable release).
5. **Region Selection:**
   - Choose the region geographically closest to your users and your Vercel deployment functions:
     - **India / South Asia:** Select **AWS Asia Pacific (Singapore) — `ap-southeast-1`** (paired with Vercel region `sin1`).
     - **Europe:** Select **AWS Europe (Frankfurt) — `eu-central-1`** (paired with Vercel region `fra1`).
     - **North America:** Select **AWS US East (N. Virginia) — `us-east-1`** (paired with Vercel region `iad1`).
   - *Crucial Rule:* Always locate your Vercel Function region in the exact same metropolitan area/region as your Neon database to avoid cross-continent network latency penalties (which can add 150ms–300ms per database query).
6. Click **Create Project**. Neon will provision the project with a default root branch named `main`.

---

## 2. Understanding Connection Strings: Pooled vs. Direct

Neon provides two distinct connection endpoints for every database branch. Understanding the distinction is vital for serverless operations:

### A. Pooled Connection (`DATABASE_URL`) — For Application Runtime
- **Purpose:** Used by your Next.js application at runtime across Vercel serverless lambdas.
- **Mechanism:** Routes queries through Neon's built-in PgBouncer connection pooler (port `6543` or `-pooler` hostname). PgBouncer holds database connections open and multiplexes thousands of ephemeral serverless function requests onto a small set of PostgreSQL backend processes.
- **Hostname Pattern:** Contains `-pooler` in the domain.
- **Example Format (Placeholder Only):**
  ```text
  postgresql://[USER]:[PASSWORD]@ep-[PROJECT_NAME]-pooler.[REGION].aws.neon.tech/[DBNAME]?sslmode=require&pgbouncer=true&connect_timeout=15
  ```

### B. Direct Connection (`DIRECT_URL`) — For Schema Migrations & CLI
- **Purpose:** Used strictly for running schema migrations (`prisma migrate deploy`, `prisma migrate dev`, `prisma db push`) and administrative scripts (`pg_dump`, connection verification).
- **Mechanism:** Bypasses PgBouncer and connects directly to the dedicated Postgres engine process (port `5432`). Prisma migrations require session-level locking (`pg_advisory_lock`), which is unsupported or causes transaction failures in PgBouncer transaction-pooling mode.
- **Hostname Pattern:** Does **NOT** contain `-pooler`.
- **Example Format (Placeholder Only):**
  ```text
  postgresql://[USER]:[PASSWORD]@ep-[PROJECT_NAME].[REGION].aws.neon.tech/[DBNAME]?sslmode=require&connect_timeout=15
  ```

### Comparison Summary

| Parameter | Pooled Connection (`DATABASE_URL`) | Direct Connection (`DIRECT_URL`) |
|---|---|---|
| **Primary Consumer** | Next.js App / `PrismaClient` runtime | `prisma migrate`, `pg_dump`, CI deploy scripts |
| **Hostname** | Includes `-pooler` | Standard hostname (no `-pooler`) |
| **Port** | `6543` (or default with `-pooler`) | `5432` |
| **Pooler Flag** | Append `&pgbouncer=true` | Omit `pgbouncer=true` |
| **SSL Enforcement** | Required (`sslmode=require`) | Required (`sslmode=require`) |
| **Connection Timeout** | `connect_timeout=15` | `connect_timeout=15` |

---

## 3. Database Branching Strategy

Neon features instant, copy-on-write database branching. Treat database branches like Git branches:

```
[Neon: main]  (Production data - protected)
      │
      ├── [Neon: dev]  (Staging / local development baseline)
      │
      └── [Neon: preview/pr-42]  (Ephemeral branch for CI test & Vercel Preview)
```

### 1. `main` Branch (Production)
- The default branch created with the project.
- Houses production data.
- Direct write access should be restricted to CI/CD production pipelines and migrations.

### 2. `dev` Branch (Staging & Local Development)
- Created as a child branch of `main` without copying sensitive production customer data (or using sanitized seed data).
- Used by developers for testing schema migrations locally via `prisma migrate dev`.
- **How to create in Neon Console:**
  1. Navigate to **Branches** in the Neon console.
  2. Click **Create Branch**.
  3. Set Name to `dev`, select Parent Branch: `main`.

### 3. Ephemeral Preview Branches (`preview/pr-<number>`)
- Created automatically by GitHub Actions when a Pull Request is opened against `main`.
- Isolates schema changes and migrations during E2E testing without contaminating `dev` or `main`.
- Automatically deleted by GitHub Actions when the Pull Request is closed or merged.

---

## 4. Free-Tier Behavior & Cold-Start Mitigation

On Neon's Free Tier, compute nodes **autosuspend** (scale to zero) after 5 minutes of inactivity to preserve compute quota.

### The Symptom: Cold Start Latency
When the database is suspended:
- The first incoming connection triggers a cold boot.
- Postgres spin-up typically takes **1.5 to 3.5 seconds**.
- If client timeouts are set too aggressively (e.g. 2–3 seconds), Prisma will throw `P1001: Can't reach database server at...` or connection reset errors.

### Mitigation Architecture
1. **URL Parameter Tuning:**
   Append `&connect_timeout=15` to both `DATABASE_URL` and `DIRECT_URL`. This gives the Neon compute layer 15 seconds to wake up before Prisma fails the connection.
2. **Serverless Connection Pooling:**
   Ensure `DATABASE_URL` uses the pooled endpoint with `&pgbouncer=true`.
3. **Application Retry Helper (`with-retry.ts`):**
   Wrap critical cold-start operations in an exponential backoff retry loop that specifically handles error codes `P1001`, `P1002`, and `P1017`.
4. **Pre-Demo Warm-Up:**
   Before running live demonstrations, stakeholder evaluations, or smoke tests:
   ```bash
   curl -I https://your-deployment.vercel.app/api/health
   ```
   Calling `/api/health` issues a `SELECT 1` query that wakes the Neon compute node. Subsequent requests during the next 5 minutes will execute with sub-10ms query latencies.

---

## 5. Security: Least-Privilege Application Role

By default, Neon provides a `neondb_owner` role possessing superuser-like permissions. For production security hardening, create a dedicated application role with restricted grants:

### In Neon SQL Editor (Connected to `main` branch):
```sql
-- 1. Create a dedicated application role with login capability
CREATE ROLE acm_app WITH LOGIN PASSWORD 'YOUR_STRONG_SECURE_PASSWORD_HERE';

-- 2. Grant connection rights to the database
GRANT CONNECT ON DATABASE neondb TO acm_app;

-- 3. Grant schema usage
GRANT USAGE ON SCHEMA public TO acm_app;

-- 4. Grant DML rights on existing tables and sequences
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO acm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO acm_app;

-- 5. Ensure future tables created by migrations inherit these rights
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO acm_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO acm_app;
```

> **When to Use:**
> - `acm_app`: Used in runtime `DATABASE_URL` for the Vercel application.
> - `neondb_owner`: Used strictly in `DIRECT_URL` for CI/CD schema migrations (`prisma migrate deploy`), as DDL statements (`CREATE TABLE`, `ALTER TABLE`) require owner privileges.

---

## 6. IP Allow-Listing Notice

- **Vercel Free/Hobby & Pro Plans:** Utilize dynamic serverless IP pools from AWS. Static outbound IPs are not provided by Vercel unless you subscribe to Vercel Enterprise with dedicated Secure Compute.
- **Neon Configuration:** Do **not** enable IP allow-listing in the Neon Project Settings unless you have dedicated static IPs. Neon's TLS 1.3 encryption, enforced SSL (`sslmode=require`), and strong credential generation provide full transport-layer and authentication protection.

---

## 7. Optional Architecture: `@prisma/adapter-neon`

Neon offers a serverless WebSocket driver (`@neondatabase/serverless`) and a Prisma driver adapter (`@prisma/adapter-neon`).

### How It Works
Instead of Prisma opening a TCP socket (which standard edge functions cannot do without polyfills), Prisma queries are routed over WebSockets using Neon's serverless HTTP/WebSocket protocol.

### Tradeoff Analysis

| Metric | Standard Prisma (`@prisma/client`) + PgBouncer | Neon Driver Adapter (`@prisma/adapter-neon`) |
|---|---|---|
| **Runtime Target** | Node.js Serverless Functions (Vercel standard) | Edge Functions (`runtime: "edge"`) |
| **Connection Protocol** | Standard PostgreSQL TCP (port `6543`) | WebSockets / HTTP Fetch |
| **Cold Start Performance** | ~1.5s–3s (traditional spin-up) | ~500ms–1.5s |
| **Transaction Compatibility** | Full ACID support via PgBouncer | Interactive transactions over WebSockets |
| **Complexity** | Minimal, standard Prisma workflow | Requires additional adapter dependencies |

**Recommendation:** For ACM Resolve, use the standard `@prisma/client` with the pooled `DATABASE_URL` and `with-retry.ts` helper. Adopt `@prisma/adapter-neon` only if migrating API routes to Vercel Edge Runtime.
