# M1 Integration Notes & Manual Diff Guide

**Applies to:** Repository Maintainers & Evaluators  
**Rule Adherence:** Zero existing files were modified. All required integrations are documented below as minimal copy-paste diffs.

---

## 1. Required NPM Packages Installation

Run the following command to install the required runtime and development dependencies:

```bash
npm install @prisma/client prisma next-auth @next-auth/prisma-adapter zod date-fns @tanstack/react-query recharts
npm install -D vitest @playwright/test ts-node @types/node
```

---

## 2. Optional Manual Diffs for Existing Files

### 2.1 Root Layout (`app/layout.tsx`) — Wrapping with `AuthProvider`
To provide NextAuth sessions and TanStack Query client to the entire application:

**File:** `app/layout.tsx`  
**Location:** Wrap `{children}` inside `<body>` with `<AuthProvider>`

```diff
  import type { Metadata } from "next";
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
+ import { AuthProvider } from "@/src/providers/auth-provider";

  ...

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
+         <AuthProvider>
            {children}
+         </AuthProvider>
        </body>
      </html>
    );
  }
```

---

### 2.2 NextAuth Route Handler (`app/api/auth/[...nextauth]/route.ts`)
The M1 implementation includes enriched NextAuth configuration in `src/lib/auth/options.ts` (with `hd` Google prompt, initial admin escalation, and fresh database session checks).

**File:** `app/api/auth/[...nextauth]/route.ts`

```diff
  import NextAuth from "next-auth";
- import { authOptions } from "@/src/modules/auth/authOptions";
+ import { authOptions } from "@/src/lib/auth/options";

  const handler = NextAuth(authOptions);

  export { handler as GET, handler as POST };
```

---

### 2.3 Package.json Scripts (`package.json`)
To enable test and migration shortcuts in your developer terminal:

**File:** `package.json`

```diff
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
+   "test": "vitest run",
+   "test:watch": "vitest",
+   "test:e2e": "playwright test",
+   "prisma:generate": "prisma generate",
+   "prisma:migrate": "prisma migrate dev",
+   "seed:m1": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed-m1.ts"
  },
```

---

## 3. Prisma Schema Merging Instructions

Per the hard constraint, `prisma/schema.prisma` was not modified directly. Instead:
1. Multi-file schema preview was added under [prisma/schema/m1/m1.prisma](file:///d:/Projects/incursion/prisma/schema/m1/m1.prisma).
2. The standalone model definitions are available in [docs/m1/schema-additions.prisma](file:///d:/Projects/incursion/docs/m1/schema-additions.prisma).
3. The SQL migration is ready to run in [prisma/migrations/20261012_m1_init/migration.sql](file:///d:/Projects/incursion/prisma/migrations/20261012_m1_init/migration.sql).

### How to Merge into `prisma/schema.prisma` (if not using multi-file folders):
1. In `prisma/schema.prisma`, append the `isActive` column to `model User`:
   ```prisma
   model User {
     ...
     isActive Boolean @default(true)
     accounts Account[]
     sessions Session[]
   }
   ```
2. Append the contents of `docs/m1/schema-additions.prisma` to the bottom of `prisma/schema.prisma`.
3. Run `npx prisma generate`.
