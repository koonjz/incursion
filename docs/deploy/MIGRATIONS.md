# Database Migrations & Data Safety Guide

**Application:** ACM Resolve  
**ORM:** Prisma 6  
**Target Engine:** Neon Serverless PostgreSQL  

---

## 1. Migration Lifecycle: Development to Production

```
1. Local Dev against Neon 'dev' branch
   prisma migrate dev --name add_feature
      │
      ▼
2. Git Pull Request & Code Review
   Automated ephemeral Neon branch: preview/pr-X
   prisma migrate deploy (tested via CI)
      │
      ▼
3. Merge to 'main'
   GitHub Environment 'production' approval gate
   scripts/db/migrate-deploy.sh executes against Neon 'main'
```

### Cardinal Rules:
1. **NEVER run `prisma migrate dev` or `prisma db push` against Production:**
   - `prisma migrate dev` creates interactive shadow databases and may reset schemas.
   - `prisma db push` bypasses migration history tracking and can drop columns silently.
   - Production migrations must **only** be applied using `prisma migrate deploy` (or our runner `scripts/db/migrate-deploy.sh`).
2. **Always run migrations through `DIRECT_URL`:**
   - Migrations acquire PostgreSQL advisory locks (`pg_advisory_lock`), which fail or hang when routed through PgBouncer transaction poolers (`DATABASE_URL`).

---

## 2. Local Migration Workflow

To create a new migration:
1. Ensure your `.env.local` points `DIRECT_URL` and `DATABASE_URL` to your Neon **`dev`** branch (never `main`).
2. Update `prisma/schema.prisma` with your model or field additions.
3. Generate the migration file:
   ```bash
   npx prisma migrate dev --name descriptive_migration_name
   ```
4. Review the generated SQL in `prisma/migrations/<timestamp>_descriptive_migration_name/migration.sql`.
5. Verify application functionality locally.
6. Commit the migration directory to Git and open a Pull Request.

---

## 3. The Expand / Contract Pattern for Zero-Downtime Changes

When making breaking schema changes (e.g. renaming columns, removing fields, changing data types), perform the change across two distinct releases:

### Example: Renaming `contactEmail` to `organizerEmail`

#### Phase 1: Expand (Release N)
1. Add the new column `organizerEmail` as nullable in Prisma schema:
   ```prisma
   organizerEmail String?
   ```
2. Write application code to write to **both** columns, and read from `organizerEmail` if present, falling back to `contactEmail`.
3. Run a backfill query or migration to copy existing data from `contactEmail` to `organizerEmail`.
4. Deploy Release N.

#### Phase 2: Contract (Release N+1)
1. After all application traffic has transitioned to Release N, update the schema to mark `organizerEmail` as required and remove `contactEmail`.
2. Generate migration dropping the old `contactEmail` column.
3. Deploy Release N+1.

---

## 4. Baselining an Existing Database

If you connect to an existing database that already has tables created outside of Prisma migrations, running `prisma migrate deploy` may fail because tables already exist.

To baseline the existing database:
1. Ensure your local `prisma/migrations` contains the initial migration SQL matching the database schema.
2. Mark the initial migration as already applied using the `--applied` flag:
   ```bash
   npx prisma migrate resolve --applied 20261012_m1_init
   ```
3. Subsequent new migrations will apply cleanly without attempting to recreate existing tables.

---

## 5. Rollback Strategies: Neon Point-in-Time Restore & Branch Restore

Traditional down-migrations (`prisma migrate down`) are error-prone and often result in data loss. With Neon, rollbacks are handled instantaneously via copy-on-write branching:

### Strategy A: Instant Point-in-Time Restore (PITR)
If a faulty migration corrupts data on the `main` branch:
1. In the Neon Console, navigate to **Branches > main**.
2. Click **Time Travel / Point-in-Time Restore**.
3. Select a timestamp **1 minute before the deployment occurred**.
4. Create a new branch named `recovery-main` from that historical state.
5. In Vercel Project Settings, update `DATABASE_URL` and `DIRECT_URL` to point to `recovery-main`.
6. Redeploy Vercel. Your entire database is restored instantly to the exact second prior to the incident without waiting for lengthy database dump restores!

### Strategy B: Vercel Instant Rollback
Pair the Neon database restore with Vercel's Instant Rollback:
1. In the Vercel Dashboard, go to **Deployments**.
2. Find the previous stable production deployment.
3. Click the three dots (···) and select **Instant Rollback**.
4. Traffic is redirected to the previous build within seconds.
