import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/src/lib/rbac/server-guard";
import * as rbacModule from "@/src/modules/auth/rbac";

describe("M1 withRole API Higher-Order Wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 UNAUTHORIZED when no user session is present", async () => {
    vi.spyOn(rbacModule, "getCurrentUser").mockResolvedValue(null);

    const handler = withRole(["ADMIN"], async () => {
      return NextResponse.json({ success: true });
    });

    const req = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await handler(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 FORBIDDEN when user has insufficient role", async () => {
    vi.spyOn(rbacModule, "getCurrentUser").mockResolvedValue({
      id: "usr-viewer-1",
      name: "Student Alex",
      email: "alex@university.edu",
      role: "STUDENT",
    });

    const handler = withRole(["ADMIN"], async () => {
      return NextResponse.json({ success: true });
    });

    const req = new NextRequest("http://localhost:3000/api/admin/semesters");
    const response = await handler(req);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 when user possesses allowed role", async () => {
    vi.spyOn(rbacModule, "getCurrentUser").mockResolvedValue({
      id: "usr-admin-1",
      name: "Dean Admin",
      email: "admin@university.edu",
      role: "ADMIN",
    });

    const handler = withRole(["ADMIN"], async (req, { user }) => {
      return NextResponse.json({ success: true, userRole: user.role });
    });

    const req = new NextRequest("http://localhost:3000/api/admin/semesters");
    const response = await handler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.userRole).toBe("ADMIN");
  });

  it("formats Zod validation errors cleanly as 400 with details", async () => {
    vi.spyOn(rbacModule, "getCurrentUser").mockResolvedValue({
      id: "usr-admin-1",
      name: "Dean Admin",
      email: "admin@university.edu",
      role: "ADMIN",
    });

    const testSchema = z.object({
      allocatedAmount: z.number().min(1, "Amount must be at least 1"),
    });

    const handler = withRole(["ADMIN"], async () => {
      testSchema.parse({ allocatedAmount: -10 });
      return NextResponse.json({ success: true });
    });

    const req = new NextRequest("http://localhost:3000/api/admin/budgets");
    const response = await handler(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details.length).toBeGreaterThan(0);
    expect(json.error.details[0].field).toBe("allocatedAmount");
  });
});
