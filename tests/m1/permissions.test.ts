import { describe, it, expect } from "vitest";
import { can, hasRole, normalizeRole, ROLE_PERMISSIONS } from "@/src/lib/rbac/permissions";

describe("M1 RBAC: Permission Matrix & Role Evaluation", () => {
  it("normalizes VIEWER to STUDENT role for backward compatibility", () => {
    expect(normalizeRole("VIEWER")).toBe("STUDENT");
    expect(normalizeRole("ADMIN")).toBe("ADMIN");
    expect(normalizeRole("ORGANIZER")).toBe("ORGANIZER");
    expect(normalizeRole("STUDENT")).toBe("STUDENT");
  });

  it("evaluates hasRole accurately across aliases", () => {
    expect(hasRole("ADMIN", ["ADMIN"])).toBe(true);
    expect(hasRole("ADMIN", ["ORGANIZER", "STUDENT"])).toBe(false);

    // VIEWER and STUDENT equivalence
    expect(hasRole("STUDENT", ["VIEWER"])).toBe(true);
    expect(hasRole("VIEWER", ["STUDENT"])).toBe(true);

    // Multi-role checks
    expect(hasRole("ORGANIZER", ["ADMIN", "ORGANIZER"])).toBe(true);
    expect(hasRole("STUDENT", ["ADMIN", "ORGANIZER"])).toBe(false);
  });

  it("ADMIN possesses all system permissions", () => {
    const adminPermissions = ROLE_PERMISSIONS.ADMIN;
    expect(can("ADMIN", "events:create")).toBe(true);
    expect(can("ADMIN", "semesters:manage")).toBe(true);
    expect(can("ADMIN", "users:manage_roles")).toBe(true);
    expect(can("ADMIN", "budgets:override")).toBe(true);
    expect(adminPermissions.length).toBeGreaterThan(15);
  });

  it("ORGANIZER can create events but cannot manage semesters or roles", () => {
    expect(can("ORGANIZER", "events:create")).toBe(true);
    expect(can("ORGANIZER", "resources:book")).toBe(true);
    expect(can("ORGANIZER", "semesters:manage")).toBe(false);
    expect(can("ORGANIZER", "users:manage_roles")).toBe(false);
    expect(can("ORGANIZER", "budgets:override")).toBe(false);
  });

  it("VIEWER / STUDENT has read-only permissions", () => {
    expect(can("STUDENT", "events:view")).toBe(true);
    expect(can("STUDENT", "resources:view")).toBe(true);
    expect(can("STUDENT", "semesters:view")).toBe(true);
    expect(can("STUDENT", "events:create")).toBe(false);
    expect(can("STUDENT", "budgets:create")).toBe(false);
    expect(can("STUDENT", "users:manage_roles")).toBe(false);

    expect(can("VIEWER", "events:view")).toBe(true);
    expect(can("VIEWER", "events:create")).toBe(false);
  });
});
