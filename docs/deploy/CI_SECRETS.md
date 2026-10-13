# GitHub Actions Secrets & Variables Reference

**Application:** ACM Resolve  
**Repository Settings Path:** **Settings > Secrets and variables > Actions**  

---

## 1. Repository Secrets (`${{ secrets.* }}`)

Add these values under **Repository secrets** (encrypted at rest):

| Secret Name | Required By | Description & Instructions | Example Value (Placeholders) |
|---|---|---|---|
| `NEON_API_KEY` | `neon-preview-branch.yml`<br>`neon-cleanup-branch.yml` | Neon personal API key with permissions to create and delete branches. Generate in **Neon Console > Account Settings > Developer Settings > API Keys**. | `neon_api_key_ab12cd34ef56...` |
| `DIRECT_URL` | `production-migrate.yml` | Neon direct connection string (unpooled, port `5432`) used strictly for running DDL schema migrations with advisory locks. | `postgresql://neondb_owner:[PASS]@ep-[NAME].ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL` | `production-migrate.yml` | Neon pooled connection string (port `6543`, `-pooler`) used for fallback verification. | `postgresql://acm_app:[PASS]@ep-[NAME]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true` |
| `VERCEL_TOKEN` | Optional (Vercel Deployments) | Personal Access Token from Vercel Account Settings to trigger CLI deployments or link projects. | `vck_abc123xyz456...` |

---

## 2. Repository Variables (`${{ vars.* }}`)

Add these values under **Repository variables** (non-sensitive configuration):

| Variable Name | Required By | Description | Example Value |
|---|---|---|---|
| `NEON_PROJECT_ID` | Preview Workflows | The Neon Project ID found in the Project Settings page. | `cold-frost-12345678` |
| `PRODUCTION_URL` | Post-Deploy Smoke Test | The canonical public URL of the production deployment to curl for `/api/health`. | `https://acm-resolve.yourcollege.edu` |

---

## 3. GitHub Environment Protection Rules (`production`)

The workflow `.github/workflows/production-migrate.yml` targets the `production` environment:

1. In GitHub, navigate to **Settings > Environments**.
2. Click **New environment** and enter name: `production`.
3. Check **Required reviewers** and assign senior engineering leads / DevOps owners.
4. (Optional) Set **Deployment branches** to `main` only.
5. Under **Environment secrets**, you can optionally override `DIRECT_URL` and `DATABASE_URL` so that only approved production releases can access production credentials.
