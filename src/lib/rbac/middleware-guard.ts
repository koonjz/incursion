import { NextRequest, NextResponse } from "next/server";
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

  // 1. Check for standard NextAuth session cookies
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  // 2. Support for CI / E2E test headers
  const testRole = (process.env.ALLOW_HEADER_AUTH === "true" || process.env.NODE_ENV === "test")
    ? (req.headers.get("x-user-role") as UserRole | null)
    : null;
  const testUserId = (process.env.ALLOW_HEADER_AUTH === "true" || process.env.NODE_ENV === "test")
    ? req.headers.get("x-user-id")
    : null;

  // Extract user info from session cookie if encoded JWT (payload is 2nd segment)
  let cookieRole: UserRole | null = null;
  let isDeactivated = false;

  if (sessionToken && sessionToken.includes(".")) {
    try {
      const parts = sessionToken.split(".");
      if (parts.length >= 2) {
        // Base64URL decode JWT payload in edge runtime
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonString = atob(base64);
        const parsed = JSON.parse(jsonString);
        if (parsed.role) cookieRole = parsed.role as UserRole;
        if (parsed.isActive === false) isDeactivated = true;
      }
    } catch {
      // In encrypted JWE tokens, server-side withRole validates role
    }
  }

  const isAuthenticated = Boolean(sessionToken || testUserId);
  const userRole: UserRole = testRole || cookieRole || "STUDENT";

  // 3. Unauthenticated Redirection
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

  // 4. Deactivated Account Check
  if (isDeactivated) {
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

  // 5. Admin Route Protection (/admin/** & /api/admin/**)
  if (isAdminRoute || isProtectedApi) {
    // If we have explicit non-admin role in header or cookie, block immediately
    if (testRole && testRole !== "ADMIN") {
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

    if (cookieRole && cookieRole !== "ADMIN") {
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

  // 6. Organizer Route Protection (/organizer/**)
  if (isOrganizerRoute) {
    if (userRole !== "ADMIN" && userRole !== "ORGANIZER" && userRole !== "HOD") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  return NextResponse.next();
}
