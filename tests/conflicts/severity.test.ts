import { describe, it, expect } from "vitest";
import {
  calculateConflictScore,
  calculateOverallScore,
  DEFAULT_CONFLICT_WEIGHTS,
  mapScoreToSeverity,
} from "@/src/modules/conflicts/severity";

describe("severity - Conflict Scoring & Mapping", () => {
  // 1. Severity level mappings
  it("maps scores to LOW severity level when score < 30", () => {
    expect(mapScoreToSeverity(0)).toBe("LOW");
    expect(mapScoreToSeverity(15)).toBe("LOW");
    expect(mapScoreToSeverity(29)).toBe("LOW");
  });

  it("maps scores to MEDIUM severity level when 30 <= score < 60", () => {
    expect(mapScoreToSeverity(30)).toBe("MEDIUM");
    expect(mapScoreToSeverity(45)).toBe("MEDIUM");
    expect(mapScoreToSeverity(59)).toBe("MEDIUM");
  });

  it("maps scores to HIGH severity level when 60 <= score < 85", () => {
    expect(mapScoreToSeverity(60)).toBe("HIGH");
    expect(mapScoreToSeverity(75)).toBe("HIGH");
    expect(mapScoreToSeverity(84)).toBe("HIGH");
  });

  it("maps scores to CRITICAL severity level when score >= 85", () => {
    expect(mapScoreToSeverity(85)).toBe("CRITICAL");
    expect(mapScoreToSeverity(95)).toBe("CRITICAL");
    expect(mapScoreToSeverity(100)).toBe("CRITICAL");
  });

  // 2. Duration scaling
  it("scales conflict score higher for longer overlap durations", () => {
    const shortOverlapScore = calculateConflictScore("VENUE_OVERLAP", 15, 60);
    const fullOverlapScore = calculateConflictScore("VENUE_OVERLAP", 60, 60);
    expect(fullOverlapScore).toBeGreaterThan(shortOverlapScore);
  });

  // 3. Weighting priority
  it("assigns higher score to venue clashes than resource clashes for same duration", () => {
    const venueScore = calculateConflictScore("VENUE_OVERLAP", 60, 60);
    const resourceScore = calculateConflictScore("RESOURCE_CLASH", 60, 60);
    expect(venueScore).toBeGreaterThan(resourceScore);
  });

  // 4. Custom weights configuration
  it("respects customized weights configuration", () => {
    const customWeights = {
      venue: 10,
      organizer: 10,
      resource: 50,
      group: 10,
      buffer: 10,
    };
    const score = calculateConflictScore("RESOURCE_CLASH", 60, 60, customWeights);
    expect(score).toBeGreaterThan(50);
  });

  // 5. Composite overall score
  it("calculates composite score combining multiple conflicts", () => {
    const scores = [80, 40, 20];
    const overall = calculateOverallScore(scores);
    expect(overall).toBeGreaterThanOrEqual(80);
    expect(overall).toBeLessThanOrEqual(100);
  });

  it("returns 0 overall score for empty conflict list", () => {
    expect(calculateOverallScore([])).toBe(0);
  });
});
