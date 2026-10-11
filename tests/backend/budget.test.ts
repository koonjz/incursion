import { describe, it, expect } from "vitest";

describe("budget - Aggregation Calculations", () => {
  it("calculates remaining budget and percentage accurately", () => {
    const allocated = 50000;
    const spent = 32500;
    const remaining = Math.max(0, allocated - spent);
    const percentage = Math.round((spent / allocated) * 100);

    expect(remaining).toBe(17500);
    expect(percentage).toBe(65);
  });

  it("handles zero allocated budget without dividing by zero", () => {
    const allocated = 0;
    const spent = 2500;
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
    const remaining = Math.max(0, allocated - spent);

    expect(percentage).toBe(0);
    expect(remaining).toBe(0);
  });

  it("detects over-budget threshold", () => {
    const allocated = 10000;
    const existingSpent = 8500;
    const attemptedExpense = 2000;

    const projectedTotal = existingSpent + attemptedExpense;
    const isOverBudget = projectedTotal > allocated;
    const overage = projectedTotal - allocated;

    expect(isOverBudget).toBe(true);
    expect(overage).toBe(500);
  });

  it("allows expense within remaining budget", () => {
    const allocated = 10000;
    const existingSpent = 7000;
    const attemptedExpense = 3000;

    const projectedTotal = existingSpent + attemptedExpense;
    const isOverBudget = projectedTotal > allocated;

    expect(isOverBudget).toBe(false);
  });
});
