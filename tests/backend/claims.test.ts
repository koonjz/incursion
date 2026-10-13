import { describe, it, expect } from "vitest";
import {
  listAllClaims,
  createNewClaim,
  getExpenseMetrics,
  getCategoryCaps,
  getEventVarianceData,
  formatClaimsToCSV,
} from "@/src/modules/expenses/claimsService";

describe("Expenses & Budget Backend Module (kanishtha-1 integration)", () => {
  it("lists all claims with pagination and filtering", async () => {
    const result = await listAllClaims({ limit: 10 });
    expect(result.claims).toBeDefined();
    expect(Array.isArray(result.claims)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
    expect(result.claims.length).toBeLessThanOrEqual(10);
  });

  it("filters claims by category", async () => {
    const result = await listAllClaims({ category: "Food & Catering" });
    for (const c of result.claims) {
      expect(c.category).toBe("Food & Catering");
    }
  });

  it("creates a new expense claim and updates list", async () => {
    const newClaim = await createNewClaim({
      event: "ACM Hackathon 2026",
      category: "Food & Catering",
      description: "Midnight energy snacks for coders",
      amount: 1500,
      merchant: "Campus Store",
    });

    expect(newClaim.id).toBeDefined();
    expect(newClaim.amount).toBe(1500);
    expect(newClaim.description).toBe("Midnight energy snacks for coders");
    expect(newClaim.status).toBe("approved");
  });

  it("computes accurate expense metrics", async () => {
    const metrics = await getExpenseMetrics();
    expect(metrics.semesterGrantAllocation).toBe(100000);
    expect(metrics.totalDisbursed).toBeGreaterThan(0);
    expect(metrics.remainingLedger).toBe(
      metrics.semesterGrantAllocation - metrics.totalDisbursed
    );
    expect(metrics.auditCapPercent).toBe(80);
    expect(metrics.fundUtilizationPercent).toBeGreaterThan(0);
  });

  it("calculates category caps with burn rate statuses", async () => {
    const caps = await getCategoryCaps();
    expect(caps.length).toBe(6);
    for (const cap of caps) {
      expect(cap.cap).toBeGreaterThan(0);
      expect(["nominal", "near_cap", "low_burn"]).toContain(cap.status);
    }
  });

  it("computes event variance and participant cost ratios", async () => {
    const variance = await getEventVarianceData("ACM Hackathon 2026");
    expect(variance.eventCode).toBe("ACM-HK-26");
    expect(variance.sanctioned).toBe(18000);
    expect(variance.registeredParticipants).toBe(300);
    expect(variance.lineItems.length).toBe(4);
    expect(variance.participantCostRatio).toBeGreaterThan(0);
  });

  it("formats claims to valid RFC 4180 CSV", async () => {
    const { claims } = await listAllClaims({ limit: 5 });
    const csv = formatClaimsToCSV(claims);
    expect(csv).toContain("Claim ID,Date,Event,Category,Description");
    expect(csv.split("\n").length).toBeGreaterThanOrEqual(6);
  });
});
