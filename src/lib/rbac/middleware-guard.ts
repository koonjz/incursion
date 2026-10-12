import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { hasRole } from "./permissions";
import { UserRole } from "@/src/modules/auth/rbac";

export async function middlewareGuard(req: NextRequest): Promise<NextResponse | undefined> {
  const { pathname } = req.nextUrl;

  // Paths requiring specific roles
  const isAdminRoute = pathname.startsWith("/admin");
  const isOrganizerRoute = pathname.startsWith("/organizer");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isProtectedApi = pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isOrganizerRoute && !isDashboardRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  // NextAuth JWT extraction
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "m1-auth-default-secret-string-replace-in-production",
  });

  // Support for CI / E2E test headers
  const testRole = (process.env.ALLOW_HEADER_AUTH === "true" || process.env.NODE_ENV === "test")
    ? (req.headers.get("x-user-role") as UserRole | null)
    : null;
  const testUserId = (process.env.ALLOW_HEADER_AUTH === "true" || process.env.NODE_ENV === "test")
    ? req.headers.get("x-user-id")
    : null;

  const isAuthenticated = Boolean(token?.id || testUserId);
  const userRole = (token?.role as UserRole | undefined) || testRole || "STUDENT";
  const isActive = token?.isActive !== false;

  // 1. Unauthenticated Redirection
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Deactivated Account Check
  if (!isActive) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "DEACTIVATED", message: "Account is deactivated" },
        },
        { status: 403 }
      );
    }
    const deactivatedUrl = new URL("/403", req.url);
    deactivatedUrl.searchParams.set("reason", "deactivated");
    return NextResponse.redirect(deactivatedUrl);
  }

  // 3. Admin Route Protection (/admin/** & /api/admin/**)
  if (isAdminRoute || isProtectedApi) {
    if (!hasRole(userRole, ["ADMIN"])) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: { code: "FORBIDDEN", message: "Admin role required" },
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  // 4. Organizer Route Protection (/organizer/**)
  if (isOrganizerRoute) {
    if (!hasRole(userRole, ["ADMIN", "ORGANIZER", "HOD"])) {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  return NextResponse.next();
}
