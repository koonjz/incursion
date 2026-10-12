import { describe, it, expect } from "vitest";
import { createDepartmentBudgetSchema } from "@/src/lib/validation/admin";

describe("M1 Budget: Constraint Validation (spent <= allocated & override)", () => {
  it("permits budget when spent is less than or equal to allocated", () => {
    const valid = createDepartmentBudgetSchema.safeParse({
      semesterId: "sem-101",
      department: "Computer Science",
      allocated: 10000,
      spent: 4500,
      adminOverride: false,
    });
    expect(valid.success).toBe(true);

    const validEqual = createDepartmentBudgetSchema.safeParse({
      semesterId: "sem-101",
      department: "Robotics Club",
      allocated: 5000,
      spent: 5000,
      adminOverride: false,
    });
    expect(validEqual.success).toBe(true);
  });

  it("rejects budget when spent > allocated without adminOverride", () => {
    const overspend = createDepartmentBudgetSchema.safeParse({
      semesterId: "sem-101",
      department: "Cultural Committee",
      allocated: 8000,
      spent: 9500,
      adminOverride: false,
    });

    expect(overspend.success).toBe(false);
    if (!overspend.success) {
      expect(overspend.error.issues[0].message).toContain("Spent amount cannot exceed allocated amount");
    }
  });

  it("allows budget when spent > allocated IF adminOverride is true", () => {
    const authorizedOverspend = createDepartmentBudgetSchema.safeParse({
      semesterId: "sem-101",
      department: "Annual Hackathon",
      allocated: 12000,
      spent: 14500,
      adminOverride: true,
      notes: "Dean approved emergency grant for additional server capacity",
    });

    expect(authorizedOverspend.success).toBe(true);
  });
});
