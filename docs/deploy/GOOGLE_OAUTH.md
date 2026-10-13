# Google OAuth 2.0 Production Setup Guide

**Target Application:** ACM Resolve  
**Authentication Framework:** NextAuth.js (Google Provider)  
**Security Model:** Strict College Domain Restriction  

---

## 1. Google Cloud Console Configuration

### Step 1: Create or Select a GCP Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your institutional organization (e.g. `yourcollege.edu`).
3. Click the Project dropdown > **New Project**.
4. Name the project `acm-resolve-prod` and click **Create**.

---

### Step 2: Configure the OAuth Consent Screen
1. In the sidebar, navigate to **APIs & Services > OAuth consent screen**.
2. **User Type Selection:**
   - **INTERNAL (Highly Recommended for Colleges / Universities):**
     - Select **Internal** if your college uses **Google Workspace for Education**.
     - *Advantage:* Zero verification requirement by Google. Automatically restricts authentication eligibility to users with your organization's Google Workspace accounts. No 100-user cap or "unverified app" warning screens.
   - **EXTERNAL:**
     - Select **External** only if your organization does NOT have Google Workspace or if student accounts reside on a different Google domain from faculty.
     - *Requirement:* You must publish the app or add test user accounts. In production, unverified external apps show a cautionary warning screen to users until Google verifies the app domain.
3. **App Information:**
   - **App name:** `ACM Resolve`
   - **User support email:** Select your institutional admin or support email.
   - **App logo:** (Optional) Upload the ACM Resolve emblem.
   - **Application home page:** `https://acm-resolve.yourcollege.edu`
   - **Application privacy policy:** `https://acm-resolve.yourcollege.edu/privacy`
   - **Authorized domains:** Add your apex domain: `yourcollege.edu` (and `vercel.app` if deploying on standard Vercel domains).
   - **Developer contact information:** Admin contact email.
4. **Scopes:**
   - Click **Add or Remove Scopes**.
   - Select the non-sensitive standard identity scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **Save and Continue**.

---

### Step 3: Create OAuth 2.0 Credentials (Client ID)
1. In the sidebar, click **Credentials**.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application type:** Select **Web application**.
4. **Name:** `ACM Resolve Web Client (Production)`.
5. **Authorized JavaScript Origins:**
   Add each origin that will initiate authentication:
   - `http://localhost:3000` (Local development)
   - `https://acm-resolve.yourcollege.edu` (Production custom domain)
   - `https://incursion.vercel.app` (Vercel canonical project domain)
   - `https://staging-acm-resolve.yourcollege.edu` (Dedicated fixed staging domain)
6. **Authorized Redirect URIs:**
   Add the exact callback endpoints where Google will return the authorization code:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://acm-resolve.yourcollege.edu/api/auth/callback/google`
   - `https://incursion.vercel.app/api/auth/callback/google`
   - `https://staging-acm-resolve.yourcollege.edu/api/auth/callback/google`
7. Click **Create**.
8. A modal displays your **Client ID** and **Client Secret**.
   - Copy the Client ID into Vercel's `GOOGLE_CLIENT_ID`.
   - Copy the Client Secret into Vercel's `GOOGLE_CLIENT_SECRET`.

---

## 2. Preview Domains & The Wildcard URI Restriction

> [!WARNING]
> Google OAuth **explicitly disallows wildcard URIs** (e.g. `https://*-koonjz.vercel.app/api/auth/callback/google` will be rejected by Google).
> Every single redirect URI must be an exact, hardcoded character match.

### Recommended Strategy for Pull Request Previews:
1. **For End-to-End Automated CI Tests:**
   Use the built-in NextAuth `CredentialsProvider` mock mode (`E2E_AUTH=true`) implemented in `src/lib/auth/options.ts`, which bypasses external Google redirects completely.
2. **For Human Testing on Preview Environments:**
   Configure a fixed **Staging Domain** in Vercel (e.g. `staging.acm-resolve.yourcollege.edu` bound to the `develop` or `main` branch) and add that single fixed URI to Google Console.

---

## 3. Production Troubleshooting Matrix

### Error 1: `redirect_uri_mismatch` (Error 400)
- **Symptom:** Google shows "Access blocked: This app’s request is invalid" with error details `redirect_uri_mismatch`.
- **Root Cause:** The URL where NextAuth is running does not match the entries registered in the GCP console byte-for-byte.
- **Troubleshooting Steps:**
  1. Inspect the URL shown in the error details popup on Google's page. Note the exact `redirect_uri` parameter Google received.
  2. Common discrepancies:
     - Missing `https://` vs `http://`
     - Trailing slash mismatch
     - Vercel generated preview URL (e.g. `incursion-git-feature-...vercel.app`) when Google only has `acm-resolve.yourcollege.edu`.
  3. Ensure `NEXTAUTH_URL` in Vercel matches your custom domain exactly, with `https://` and **NO** trailing slash.

### Error 2: `access_denied`
- **Symptom:** NextAuth redirects to `/auth/signin?error=AccessDenied`.
- **Root Cause:**
  1. The user signed in with an email from an unauthorized domain (e.g., `user@gmail.com` when `ALLOWED_EMAIL_DOMAIN="yourcollege.edu"`). NextAuth's `signIn` callback intentionally rejects this and throws access denied.
  2. The user has been deactivated in the database (`isActive: false`).
- **Resolution:**
  - Verify the student or faculty member is using their official college email.
  - Check the database audit log or `User` table to ensure `isActive` is `true`.

### Error 3: Login Loop (Redirects back to login page without error)
- **Symptom:** User logs in with Google, completes consent, but gets returned back to the login screen without an active session.
- **Root Cause:** NextAuth cookie domain mismatch or secure cookie blocking over non-HTTPS.
- **Resolution:**
  - Verify `NEXTAUTH_URL` begins with `https://` in production.
  - Check browser cookie settings: third-party cookie blockers or cross-site tracking prevention may block session cookies if `NEXTAUTH_URL` does not match the actual URL bar domain.
