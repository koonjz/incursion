import { describe, it, expect, vi } from "vitest";
import { withDbRetry, isTransientDbError } from "@/src/lib/db/with-retry";

describe("withDbRetry & isTransientDbError", () => {
  it("correctly identifies transient Prisma error codes", () => {
    expect(isTransientDbError({ code: "P1001", message: "Can't reach db" })).toBe(true);
    expect(isTransientDbError({ code: "P1002", message: "Timed out" })).toBe(true);
    expect(isTransientDbError({ code: "P1017", message: "Connection closed" })).toBe(true);
  });

  it("correctly identifies transient network timeout messages", () => {
    expect(isTransientDbError(new Error("Connection reset by peer: ECONNRESET"))).toBe(true);
    expect(isTransientDbError(new Error("ETIMEDOUT while connecting to host"))).toBe(true);
  });

  it("returns false for non-transient errors (e.g. unique constraint, syntax error)", () => {
    expect(isTransientDbError({ code: "P2002", message: "Unique constraint failed" })).toBe(false);
    expect(isTransientDbError(new Error("Syntax error in SQL query"))).toBe(false);
    expect(isTransientDbError(null)).toBe(false);
    expect(isTransientDbError("random string")).toBe(false);
  });

  it("returns the result immediately on first attempt if successful", async () => {
    const mockFn = vi.fn().mockResolvedValue("success-data");
    const result = await withDbRetry(mockFn, { maxAttempts: 3, initialDelayMs: 10 });

    expect(result).toBe("success-data");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient error and succeeds on subsequent attempt", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce({ code: "P1001", message: "Can't reach db" })
      .mockResolvedValue("recovered-data");

    const onRetry = vi.fn();
    const result = await withDbRetry(mockFn, {
      maxAttempts: 3,
      initialDelayMs: 10,
      onRetry,
    });

    expect(result).toBe("recovered-data");
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not retry on non-transient error and throws immediately", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce({ code: "P2002", message: "Unique constraint violation" });

    await expect(
      withDbRetry(mockFn, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toMatchObject({ code: "P2002" });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting maxAttempts on persistent transient errors", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValue({ code: "P1001", message: "Database down" });

    await expect(
      withDbRetry(mockFn, { maxAttempts: 3, initialDelayMs: 5 })
    ).rejects.toMatchObject({ code: "P1001" });

    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});
