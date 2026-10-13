import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the prisma instance used by app/api/health/route.ts
vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

import { GET } from "@/app/api/health/route";
import { prisma } from "@/src/lib/prisma";

describe("Health Check API (/api/health)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 OK with database healthy status and latency when query succeeds", async () => {
    // Mock successful database response
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.database.status).toBe("healthy");
    expect(typeof body.database.latencyMs).toBe("number");
    expect(body.timestamp).toBeDefined();
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith("SELECT 1;");
  });

  it("returns 503 Service Unavailable when database query fails", async () => {
    // Mock database connection error (e.g. Neon cold-start failure or connection refused)
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValueOnce(
      new Error("P1001: Can't reach database server at ep-sample.neon.tech")
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.database.status).toBe("unreachable");
    expect(body.database.error).toContain("P1001");
  });
});
