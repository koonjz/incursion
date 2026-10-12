import { NextRequest } from "next/server";
import { middlewareGuard } from "@/src/lib/rbac/middleware-guard";

export async function middleware(request: NextRequest) {
  return await middlewareGuard(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/organizer/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
