import { describe, it, expect } from "vitest";

describe("M1 Admin Protection: Self-Demotion & Last Admin Safety Rules", () => {
  interface UserState {
    id: string;
    role: "ADMIN" | "ORGANIZER" | "STUDENT";
    isActive: boolean;
  }

  function validateRoleChange(
    actorId: string,
    target: UserState,
    newRole: "ADMIN" | "ORGANIZER" | "STUDENT",
    totalActiveAdmins: number
  ): { allowed: boolean; error?: string } {
    // Rule 1: Prevent self-demotion
    if (actorId === target.id && newRole !== "ADMIN") {
      return { allowed: false, error: "SELF_DEMOTION_PREVENTED" };
    }

    // Rule 2: Prevent demoting last remaining admin
    if (target.role === "ADMIN" && newRole !== "ADMIN" && totalActiveAdmins <= 1) {
      return { allowed: false, error: "LAST_ADMIN_PROTECTED" };
    }

    return { allowed: true };
  }

  function validateStatusToggle(
    actorId: string,
    target: UserState,
    newActiveStatus: boolean,
    totalActiveAdmins: number
  ): { allowed: boolean; error?: string } {
    // Rule 1: Prevent self-deactivation
    if (actorId === target.id && !newActiveStatus) {
      return { allowed: false, error: "SELF_DEACTIVATION_PREVENTED" };
    }

    // Rule 2: Prevent deactivating last active admin
    if (target.role === "ADMIN" && !newActiveStatus && totalActiveAdmins <= 1) {
      return { allowed: false, error: "LAST_ADMIN_PROTECTED" };
    }

    return { allowed: true };
  }

  it("prevents admin from demoting their own account", () => {
    const adminUser: UserState = { id: "usr-admin-1", role: "ADMIN", isActive: true };
    const result = validateRoleChange("usr-admin-1", adminUser, "ORGANIZER", 3);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("SELF_DEMOTION_PREVENTED");
  });

  it("prevents demoting the last remaining admin when count is 1", () => {
    const adminUser: UserState = { id: "usr-admin-sole", role: "ADMIN", isActive: true };
    const otherActor = "usr-admin-2";
    const result = validateRoleChange(otherActor, adminUser, "STUDENT", 1);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("LAST_ADMIN_PROTECTED");
  });

  it("allows demoting an admin if another active admin exists", () => {
    const adminUser: UserState = { id: "usr-admin-2", role: "ADMIN", isActive: true };
    const actorId = "usr-admin-1";
    const result = validateRoleChange(actorId, adminUser, "ORGANIZER", 2);
    expect(result.allowed).toBe(true);
  });

  it("prevents admin from deactivating their own account", () => {
    const adminUser: UserState = { id: "usr-admin-1", role: "ADMIN", isActive: true };
    const result = validateStatusToggle("usr-admin-1", adminUser, false, 2);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("SELF_DEACTIVATION_PREVENTED");
  });

  it("prevents deactivating the last remaining admin", () => {
    const adminUser: UserState = { id: "usr-admin-sole", role: "ADMIN", isActive: true };
    const actorId = "usr-admin-other";
    const result = validateStatusToggle(actorId, adminUser, false, 1);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("LAST_ADMIN_PROTECTED");
  });
});
