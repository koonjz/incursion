import { describe, it, expect } from "vitest";
import { parseISO, isAfter } from "date-fns";
import { createSemesterSchema } from "@/src/lib/validation/admin";

describe("M1 Semester: Date Validation & Overlap Formula Logic", () => {
  it("enforces endDate > startDate via Zod schema", () => {
    // Valid: end > start
    const valid = createSemesterSchema.safeParse({
      name: "Fall 2026",
      startDate: "2026-08-15T00:00:00.000Z",
      endDate: "2026-12-20T00:00:00.000Z",
    });
    expect(valid.success).toBe(true);

    // Invalid: start > end
    const invalidReversed = createSemesterSchema.safeParse({
      name: "Invalid Semester",
      startDate: "2026-12-20T00:00:00.000Z",
      endDate: "2026-08-15T00:00:00.000Z",
    });
    expect(invalidReversed.success).toBe(false);

    // Invalid: start == end
    const invalidEqual = createSemesterSchema.safeParse({
      name: "Equal Dates",
      startDate: "2026-08-15T00:00:00.000Z",
      endDate: "2026-08-15T00:00:00.000Z",
    });
    expect(invalidEqual.success).toBe(false);
  });

  it("accurately detects date interval overlaps using mathematical intervals", () => {
    const checkOverlap = (
      startA: string,
      endA: string,
      startB: string,
      endB: string
    ) => {
      const aStart = parseISO(startA).getTime();
      const aEnd = parseISO(endA).getTime();
      const bStart = parseISO(startB).getTime();
      const bEnd = parseISO(endB).getTime();

      // Overlap formula: startA <= endB AND endA >= startB
      return aStart <= bEnd && aEnd >= bStart;
    };

    // Existing: Aug 15 to Dec 20, 2026
    const semAStart = "2026-08-15T00:00:00.000Z";
    const semAEnd = "2026-12-20T00:00:00.000Z";

    // 1. Partial overlap at end: Nov 1, 2026 to Mar 1, 2027
    expect(checkOverlap(semAStart, semAEnd, "2026-11-01T00:00:00.000Z", "2027-03-01T00:00:00.000Z")).toBe(true);

    // 2. Complete containment: Sep 1, 2026 to Nov 1, 2026
    expect(checkOverlap(semAStart, semAEnd, "2026-09-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z")).toBe(true);

    // 3. Strict adjacent non-overlap (Spring 2027): Jan 10, 2027 to May 15, 2027
    expect(checkOverlap(semAStart, semAEnd, "2027-01-10T00:00:00.000Z", "2027-05-15T00:00:00.000Z")).toBe(false);

    // 4. Past non-overlap (Spring 2026): Jan 10, 2026 to May 15, 2026
    expect(checkOverlap(semAStart, semAEnd, "2026-01-10T00:00:00.000Z", "2026-05-15T00:00:00.000Z")).toBe(false);
  });
});
