# Production Security & Performance Hardening Guide

**Application:** ACM Resolve  
**Scope:** Security Architecture, Performance Optimization, & Operational Monitoring  

---

## 1. Secrets Management & Credential Rotation

### A. Rotating `NEXTAUTH_SECRET`
- **Impact:** Invalidates all existing active user JWT sessions; users will be required to re-authenticate with Google upon their next request. Database state and roles are unaffected.
- **Rotation Procedure:**
  1. Generate a new high-entropy 256-bit secret: `openssl rand -base64 32`.
  2. In Vercel Project Settings > Environment Variables, update `NEXTAUTH_SECRET` for Production.
  3. Trigger a redeployment.
  4. Best practice: Rotate at least once every 180 days, or immediately upon suspecting team credential exposure.

### B. Rotating Neon Database Passwords
1. In the Neon Console, navigate to **Roles**.
2. Select your application role (`acm_app`).
3. Click **Reset Password**. Neon generates a new secure password.
4. Immediately update `DATABASE_URL` in Vercel Environment Variables.
5. In Vercel, redeploy production.
6. The previous pooled connections will cleanly terminate and reconnect using the new credentials.

---

## 2. Recommended HTTP Security Headers (`next.config.mjs`)

To guard against Clickjacking, MIME-type sniffing, and Cross-Site Scripting (XSS), incorporate standard HTTP security headers.

> *Note:* Do not edit `next.config.mjs` directly if it pre-exists; apply this snippet during routine maintenance:

```javascript
// Add to next.config.mjs:
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 3. Rate Limiting for Authentication Endpoints

To prevent brute-force attacks against credential login and denial-of-wallet spam on transactional emails:
- Implement rate limiting on `/api/auth/*` and `/api/events/*` using **Upstash Redis** (`@upstash/ratelimit`):
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute per IP
  analytics: true,
});
```

---

## 4. Serverless Connection Pooling Optimization

Serverless platforms like Vercel can spawn dozens or hundreds of concurrent function instances in response to traffic bursts. If each function creates multiple database connections, PostgreSQL quickly runs out of available backend processes.

### Optimization Rules:
1. **Append `&connection_limit=1` to `DATABASE_URL`:**
   ```text
   postgresql://acm_app:[PASS]@ep-[NAME]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1
   ```
   This ensures each serverless container limits its local connection pool to 1 connection, maximizing the efficiency of Neon's PgBouncer layer.
2. **Global Singleton Cache:**
   Always use `src/lib/db/prisma-client.ts` which binds the client instance to `globalThis` across warm function invocations.

---

## 5. Cold-Start Mitigation Summary

| Technique | Implementation | Benefit |
|---|---|---|
| **Connection Timeout** | `connect_timeout=15` in connection string | Prevents premature connection drops while Neon wakes |
| **Retry Backoff** | `withDbRetry()` in `src/lib/db/with-retry.ts` | Automatically retries queries on transient cold start codes (`P1001`, `P1002`, `P1017`) |
| **Geographic Co-location** | Vercel Function `sin1` + Neon AWS `ap-southeast-1` | Sub-5ms network round-trip time |
| **Pre-Demo Warm-Up** | `curl -I https://acm-resolve.college.edu/api/health` | Wakes the database 1–2 minutes before presentations |

---

## 6. Observability & Operational Monitoring

### Vercel Function Logs:
- View live streaming logs and function invocations under **Deployments > Monitoring / Logs** in the Vercel Dashboard.
- Filter by status code `>= 500` to quickly catch unhandled exceptions.

### Neon Metrics Dashboard:
- In the Neon Console under **Monitoring**:
  - **Active Connections:** Monitor usage against your connection limit.
  - **Compute Units (CU):** Track autoscaling and CPU utilization.
  - **Autosuspend Events:** View historical sleep/wake transitions.
