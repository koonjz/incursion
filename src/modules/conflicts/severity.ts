import {
  ConflictType,
  ConflictWeightConfig,
  SeverityLevel,
} from "./types";

import { APP_CONFIG } from "@/src/config";

export const DEFAULT_CONFLICT_WEIGHTS: ConflictWeightConfig = APP_CONFIG.conflicts.weights;

/**
 * Calculates a 0-100 score for an individual conflict type scaled by overlap duration.
 *
 * @param type Conflict type
 * @param overlapMinutes Number of minutes events overlap or violate buffer
 * @param eventDurationMinutes Overall duration of the proposed event
 * @param weights Configurable weights
 */
export function calculateConflictScore(
  type: ConflictType,
  overlapMinutes: number,
  eventDurationMinutes = 60,
  weights: ConflictWeightConfig = DEFAULT_CONFLICT_WEIGHTS
): number {
  let baseWeight = 0;
  switch (type) {
    case "VENUE_OVERLAP":
      baseWeight = weights.venue;
      break;
    case "ORGANIZER_DOUBLE_BOOKING":
      baseWeight = weights.organizer;
      break;
    case "RESOURCE_CLASH":
      baseWeight = weights.resource;
      break;
    case "STUDENT_GROUP_OVERLAP":
      baseWeight = weights.group;
      break;
    case "BUFFER_VIOLATION":
      baseWeight = weights.buffer;
      break;
  }

  // Scaling factor based on overlap duration (normalized between 0.5 and 1.0)
  // For buffer violations, overlapMinutes is the violated gap duration
  const safeDuration = Math.max(eventDurationMinutes, 15);
  const ratio = Math.min(Math.max(overlapMinutes / safeDuration, 0.25), 1.0);

  // Scaled score between 0 and 100
  // Multiplier normalizes weight relative to a max weight scale
  const normalizedScale = 100 / weights.venue; // 100 / 40 = 2.5
  const rawScore = baseWeight * normalizedScale * ratio;

  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * Evaluates composite score from multiple detected conflicts on an event.
 */
export function calculateOverallScore(
  conflictScores: number[],
  weights: ConflictWeightConfig = DEFAULT_CONFLICT_WEIGHTS
): number {
  if (conflictScores.length === 0) return 0;

  // Highest score has largest impact, plus marginal contribution from other conflicts
  const maxScore = Math.max(...conflictScores);
  const others = conflictScores.filter((s) => s !== maxScore);
  const marginal = others.reduce((acc, curr) => acc + curr * 0.15, 0);

  return Math.min(100, Math.round(maxScore + marginal));
}

/**
 * Maps a score (0-100) to a severity level.
 * LOW (<30), MEDIUM (30-59), HIGH (60-84), CRITICAL (85+)
 */
export function mapScoreToSeverity(score: number): SeverityLevel {
  const { critical, high, medium } = APP_CONFIG.conflicts.severityThresholds;
  if (score >= critical) return "CRITICAL";
  if (score >= high) return "HIGH";
  if (score >= medium) return "MEDIUM";
  return "LOW";
}
