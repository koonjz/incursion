import { describe, it, expect } from "vitest";
import { escapeCsvCell } from "@/src/modules/reports/reportService";

describe("reports - CSV Escaping (RFC 4180)", () => {
  it("leaves standard alphanumeric strings untouched", () => {
    expect(escapeCsvCell("Workshop 101")).toBe("Workshop 101");
    expect(escapeCsvCell(12500)).toBe("12500");
  });

  it("wraps cells containing commas in double quotes", () => {
    expect(escapeCsvCell("ACM, IEEE Joint Event")).toBe('"ACM, IEEE Joint Event"');
  });

  it("escapes existing double quotes as paired double quotes", () => {
    expect(escapeCsvCell('Keynote: "Future of AI"')).toBe('"Keynote: ""Future of AI"""');
  });

  it("wraps cells containing newlines in double quotes", () => {
    expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    expect(escapeCsvCell("Line 1\r\nLine 2")).toBe('"Line 1\r\nLine 2"');
  });

  it("handles null and undefined values cleanly as empty strings", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });
});
