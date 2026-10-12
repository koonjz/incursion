import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser, AuthenticatedUser, UserRole } from "@/src/modules/auth/rbac";
import { hasRole, ExtendedRole } from "./permissions";

export interface GuardContext {
  user: AuthenticatedUser;
  params?: Record<string, string | string[]>;
}

/**
 * Server Component / Route Helper: Asserts that a user is logged in.
 */
export async function requireAuth(req?: NextRequest): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Server Component / Route Helper: Asserts that a user possesses one of the allowed roles.
 */
export async function requireRole(
  allowedRoles: ExtendedRole[],
  req?: NextRequest
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);
  if (!hasRole(user.role, allowedRoles)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Higher-Order Wrapper for Next.js Route Handlers (API Routes) with strict RBAC & Zod error formatting.
 */
export function withRole(
  allowedRoles: ExtendedRole[],
  handler: (req: NextRequest, context: GuardContext) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeProps?: { params?: Promise<Record<string, string | string[]>> | Record<string, string | string[]> }
  ): Promise<NextResponse> => {
    try {
      // 1. Resolve Next.js 15+ async params if present
      let resolvedParams: Record<string, string | string[]> | undefined;
      if (routeProps?.params) {
        resolvedParams =
          typeof (routeProps.params as unknown as Promise<unknown>)?.then === "function"
            ? await routeProps.params
            : (routeProps.params as Record<string, string | string[]>);
      }

      // 2. Authenticate Request
      const user = await getCurrentUser(req);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required to access this resource",
            },
          },
          { status: 401 }
        );
      }

      // 3. Check Account Status (isActive)
      const userStatus = (user as unknown as { isActive?: boolean }).isActive;
      if (userStatus === false) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "DEACTIVATED",
              message: "This account has been deactivated. Please contact campus administration.",
            },
          },
          { status: 403 }
        );
      }

      // 4. Authorize Role
      if (!hasRole(user.role as UserRole, allowedRoles)) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "FORBIDDEN",
              message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Your role: ${user.role}`,
            },
          },
          { status: 403 }
        );
      }

      // 5. Execute Protected Handler
      return await handler(req, { user, params: resolvedParams });
    } catch (err: unknown) {
      // Handle Zod Schema Validation Errors
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request payload",
              details: err.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      // Handle explicit UNAUTHORIZED / FORBIDDEN throws
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          return NextResponse.json(
            {
              success: false,
              data: null,
              error: { code: "UNAUTHORIZED", message: "Authentication required" },
            },
            { status: 401 }
          );
        }
        if (err.message === "FORBIDDEN") {
          return NextResponse.json(
            {
              success: false,
              data: null,
              error: { code: "FORBIDDEN", message: "Forbidden" },
            },
            { status: 403 }
          );
        }

        console.error("[withRole] Handler internal exception:", err.message);
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "INTERNAL_ERROR",
              message: err.message || "An unexpected error occurred",
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        },
        { status: 500 }
      );
    }
  };
}
