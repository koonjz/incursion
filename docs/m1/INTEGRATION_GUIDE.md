# Teammate Integration Guide (M1 Contracts)

**Audience:** All engineers developing features for M2, M3, M4 (Events, Conflicts, Resources, Budgets)  
**Author:** Team Lead + DevOps + Auth Owner (M1)  

---

## 1. How to Protect Your Pages & Components

### Server Components & Pages:
Use `requireRole` or `requireAuth` from `@/src/lib/rbac/server-guard`:

```tsx
// app/(app)/events/new/page.tsx
import { requireRole } from "@/src/lib/rbac/server-guard";

export default async function CreateEventPage() {
  // Throws FORBIDDEN if the logged-in user is not an ORGANIZER or ADMIN
  const currentUser = await requireRole(["ORGANIZER", "ADMIN"]);

  return (
    <div>
      <h1>Welcome, {currentUser.name}</h1>
      <p>Organizing for: {currentUser.department}</p>
    </div>
  );
}
```

### Client Components:
Use `<RoleGate>` from `@/src/components/auth/RoleGate` or `useRole()` from `@/src/hooks/useRole`:

```tsx
"use client";

import { RoleGate } from "@/src/components/auth/RoleGate";
import { useRole } from "@/src/hooks/useRole";
import { Button } from "@/components/ui/button";

export function EventActionButtons() {
  const { role, isAdmin } = useRole();

  return (
    <div>
      <RoleGate roles={["ORGANIZER", "ADMIN"]}>
        <Button>Submit Event for Review</Button>
      </RoleGate>

      <RoleGate roles={["ADMIN"]}>
        <Button variant="destructive">Force Override Conflicts</Button>
      </RoleGate>
    </div>
  );
}
```

---

## 2. How to Protect Your API Route Handlers

Always wrap your route handlers using `withRole` from `@/src/lib/rbac/server-guard`:

```ts
// app/api/events/route.ts
import { NextResponse } from "next/server";
import { withRole } from "@/src/lib/rbac/server-guard";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(3),
  venueId: z.string(),
});

export const POST = withRole(["ORGANIZER", "ADMIN"], async (req, { user }) => {
  const body = await req.json();
  const data = createEventSchema.parse(body);

  // Authenticated user is guaranteed:
  console.log(`Event created by user ID: ${user.id}, role: ${user.role}`);

  return NextResponse.json({ success: true, eventId: "evt_123" });
});
```

### Automatic Error Responses Provided by `withRole`:
- **Unauthenticated**: Returns HTTP 401 `{ success: false, data: null, error: { code: "UNAUTHORIZED", message: "..." } }`
- **Deactivated**: Returns HTTP 403 `{ success: false, data: null, error: { code: "DEACTIVATED", message: "..." } }`
- **Forbidden**: Returns HTTP 403 `{ success: false, data: null, error: { code: "FORBIDDEN", message: "..." } }`
- **Zod Error**: Returns HTTP 400 `{ success: false, data: null, error: { code: "VALIDATION_ERROR", details: [...] } }`

---

## 3. How to Read Current Active Semester & Budgets

### Active Semester Query:
```ts
import { prisma } from "@/src/lib/prisma";

export async function getActiveSemester() {
  const activeSemester = await prisma.$queryRawUnsafe<Array<{ id: string; name: string }>>(`
    SELECT id, name FROM "Semester" WHERE "isActive" = true LIMIT 1;
  `);
  return activeSemester[0] || null;
}
```

### Department Budget Query:
```ts
import { prisma } from "@/src/lib/prisma";

export async function getDepartmentBudget(semesterId: string, departmentName: string) {
  const budget = await prisma.$queryRawUnsafe<Array<{ allocated: number; spent: number }>>(`
    SELECT allocated, spent FROM "DepartmentBudget" 
    WHERE "semesterId" = '${semesterId}' AND "department" = '${departmentName}' 
    LIMIT 1;
  `);
  return budget[0] || null;
}
```

---

## 4. Branching & PR Contribution Rules

1. **Branch Names**: Always branch from `develop`. Name your branch `feature/<your-username>-<task-name>`.
2. **Commit Messages**: Follow Conventional Commits: `feat(events): add draft saving capability`.
3. **TypeScript**: Strict mode enabled. No `any` types.
4. **Validation**: All API inputs must be validated with Zod before processing.
5. **Testing**: Write unit tests under `tests/` for business logic.

---

## 5. Definition of Done (DoD)

A task or PR is considered **Done** only when:
- [ ] Server-side authorization (`withRole` or `requireRole`) is applied.
- [ ] Zod schema validates all incoming payloads.
- [ ] No hardcoded secrets or PII in logs.
- [ ] Unit tests pass cleanly (`npx vitest run`).
- [ ] Type check passes with 0 errors (`npx tsc --noEmit`).
- [ ] Linter passes (`npm run lint`).
- [ ] Pull request template is fully completed with test evidence.
