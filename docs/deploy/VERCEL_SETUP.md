# Vercel Deployment & Configuration Guide

**Application:** ACM Resolve  
**Platform:** [Vercel](https://vercel.com)  
**Database:** Neon Serverless PostgreSQL  

---

## 1. Importing the Repository into Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Select your GitHub repository (`incursion`).
4. **Framework Preset:** Select **Next.js**.
5. **Root Directory:** Leave as `./` (default).
6. **Build and Output Settings:**
   - **Build Command:** Override or leave default: `prisma generate && next build`
   - **Install Command:** `npm ci || npm install`
   - **Output Directory:** `.next` (default)

---

## 2. Environment Variables Matrix by Deployment Scope

Navigate to **Project Settings > Environment Variables** in Vercel. Add each variable according to the table below:

| Environment Variable | Production Scope | Preview Scope | Development Scope | Description & Example |
|---|:---:|:---:|:---:|---|
| `DATABASE_URL` | Yes | Yes (or dynamic via Neon) | Yes | Pooled connection string (`-pooler`, port `6543`, `sslmode=require`) |
| `DIRECT_URL` | Yes | Yes | Yes | Direct connection string (no `-pooler`, port `5432`) |
| `NEXTAUTH_URL` | Yes | Yes* | Yes | Canonical public URL (e.g. `https://acm-resolve.college.edu`)* |
| `NEXTAUTH_SECRET` | Yes | Yes | Yes | 32+ char base64 string (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Yes | Yes | Yes | GCP OAuth Client ID (`*.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Yes | Yes | Yes | GCP OAuth Client Secret (`GOCSPX-...`) |
| `ALLOWED_EMAIL_DOMAIN` | Yes | Yes | Yes | Campus domain filter (e.g. `college.edu`) |
| `INITIAL_ADMIN_EMAILS` | Yes | Yes | Yes | Bootstrap admin comma-separated list |
| `RESEND_API_KEY` | Yes | Optional | Optional | Transactional email provider key |
| `EMAIL_FROM` | Yes | Optional | Optional | Verified sender email address |
| `STORAGE_PROVIDER` | Yes | Yes | Yes | `cloudinary`, `s3`, or `mock` |
| `CLOUDINARY_CLOUD_NAME` | If Cloudinary | If Cloudinary | If Cloudinary | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | If Cloudinary | If Cloudinary | If Cloudinary | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | If Cloudinary | If Cloudinary | If Cloudinary | Cloudinary secret |

*\*Preview Note on NextAuth:* NextAuth v4 in Vercel automatically detects preview deployment hostnames if `NEXTAUTH_URL` is omitted on Preview scope and `VERCEL_URL` is available, provided authentication providers support the redirect URL. For Google OAuth, wildcard preview domains are disallowed by Google; see Section 5 below.

---

## 3. Generating a Secure `NEXTAUTH_SECRET`

Execute this in your terminal to generate a cryptographically strong 256-bit random secret:

```bash
openssl rand -base64 32
```

Copy the generated output directly into Vercel's `NEXTAUTH_SECRET` environment variable for **Production**, **Preview**, and **Development**.

---

## 4. Neon-Vercel Integration vs. Manual Environment Variables

You have two architectural options for connecting Vercel and Neon:

### Option A: The Native Neon Vercel Integration (Recommended for automatic branch previews)
1. In the Vercel Marketplace, search for and install the **Neon Integration**.
2. Link your Vercel project to your Neon project.
3. **What it does automatically:**
   - Injects `DATABASE_URL` into your Production environment pointing to your Neon `main` branch.
   - For every Git Pull Request / Preview deployment, the integration automatically creates an ephemeral Neon database branch and injects its pooled connection string into that preview deployment's environment!
   - When the PR is closed or merged, Vercel/Neon automatically tears down the preview database branch.

### Option B: Manual Environment Variable Management
If you prefer complete control without marketplace integrations:
1. Manually add `DATABASE_URL` and `DIRECT_URL` in Vercel Settings.
2. Use our custom GitHub Actions workflows (`.github/workflows/neon-preview-branch.yml` and `neon-cleanup-branch.yml`) to manage preview database lifecycle using the Neon REST API.

---

## 5. Adding a Custom Domain & Post-Domain Configuration

1. In the Vercel Project Dashboard, navigate to **Settings > Domains**.
2. Enter your institutional domain or subdomain (e.g. `acm-resolve.yourcollege.edu`).
3. Follow the DNS instructions provided by Vercel:
   - For a subdomain: Add a `CNAME` record pointing to `cname.vercel-dns.com`.
   - For an apex domain: Add an `A` record pointing to `76.76.21.21`.
4. Wait for Vercel to issue the automatic Let's Encrypt SSL certificate (typically 2–5 minutes).

### Crucial Post-Domain Updates:
Once your custom domain is active, update two locations immediately:
1. **In Vercel Environment Variables:**
   - Update `NEXTAUTH_URL` for **Production** to:
     ```text
     https://acm-resolve.yourcollege.edu
     ```
   - Trigger a redeployment in Vercel (**Deployments > Redeploy**) so the runtime picks up the new canonical URL.
2. **In Google Cloud Console:**
   - Add the new domain to Authorized JavaScript Origins:
     ```text
     https://acm-resolve.yourcollege.edu
     ```
   - Add the exact callback endpoint to Authorized Redirect URIs:
     ```text
     https://acm-resolve.yourcollege.edu/api/auth/callback/google
     ```
