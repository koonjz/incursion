import {
  ConflictResult,
  ExistingEvent,
  ProposedEvent,
} from "./types";
import {
  calculateConflictScore,
  DEFAULT_CONFLICT_WEIGHTS,
  mapScoreToSeverity,
} from "./severity";

/**
 * Calculates overlap in minutes between two intervals [startA, endA] and [startB, endB].
 * Returns 0 if there is no overlap or if intervals merely touch.
 */
export function getOverlapMinutes(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): number {
  const overlapStart = Math.max(startA.getTime(), startB.getTime());
  const overlapEnd = Math.min(endA.getTime(), endB.getTime());

  if (overlapStart < overlapEnd) {
    return Math.round((overlapEnd - overlapStart) / (1000 * 60));
  }
  return 0;
}

import { APP_CONFIG } from "@/src/config";

/**
 * Pure conflict detection engine.
 *
 * Overlap rule: startA < endB AND startB < endA
 * Touching boundaries (e.g. 10:00-11:00 and 11:00-12:00) is NOT an overlap.
 */
export function detectConflicts(
  proposed: ProposedEvent,
  existingEvents: ExistingEvent[],
  bufferMinutes = APP_CONFIG.conflicts.defaultBufferMinutes
): ConflictResult[] {
  const conflicts: ConflictResult[] = [];

  const startP = new Date(proposed.start);
  const endP = new Date(proposed.end);

  // Validate dates
  if (isNaN(startP.getTime()) || isNaN(endP.getTime()) || startP >= endP) {
    return [];
  }

  const proposedDuration = Math.round((endP.getTime() - startP.getTime()) / (1000 * 60));

  for (const existing of existingEvents) {
    // Exclude checking against self if editing existing event
    if (proposed.id && existing.id === proposed.id) {
      continue;
    }

    // Skip cancelled or rejected events
    if (existing.status === "REJECTED" || existing.status === "rejected") {
      continue;
    }

    const startE = new Date(existing.start);
    const endE = new Date(existing.end);

    if (isNaN(startE.getTime()) || isNaN(endE.getTime()) || startE >= endE) {
      continue;
    }

    // Overlap condition: startA < endB AND startB < endA
    const isOverlapping = startP < endE && startE < endP;
    const overlapMins = isOverlapping
      ? getOverlapMinutes(startP, endP, startE, endE)
      : 0;

    // 1. VENUE OVERLAP
    if (isOverlapping && proposed.venueId === existing.venueId) {
      const score = calculateConflictScore(
        "VENUE_OVERLAP",
        overlapMins,
        proposedDuration,
        DEFAULT_CONFLICT_WEIGHTS
      );
      conflicts.push({
        type: "VENUE_OVERLAP",
        severity: mapScoreToSeverity(score),
        conflictingEventId: existing.id,
        message: `Venue conflict: "${existing.title}" is already scheduled in this venue (${overlapMins}m overlap).`,
        overlapMinutes: overlapMins,
        score,
      });
    }

    // 2. ORGANIZER DOUBLE-BOOKING
    if (isOverlapping && proposed.organizerId === existing.organizerId) {
      const score = calculateConflictScore(
        "ORGANIZER_DOUBLE_BOOKING",
        overlapMins,
        proposedDuration,
        DEFAULT_CONFLICT_WEIGHTS
      );
      conflicts.push({
        type: "ORGANIZER_DOUBLE_BOOKING",
        severity: mapScoreToSeverity(score),
        conflictingEventId: existing.id,
        message: `Organizer double-booking: organizer is already leading "${existing.title}" during this time (${overlapMins}m overlap).`,
        overlapMinutes: overlapMins,
        score,
      });
    }

    // 3. RESOURCE CLASH
    if (isOverlapping && proposed.resources && existing.resources) {
      const clashingResources: string[] = [];
      for (const pr of proposed.resources) {
        const er = existing.resources.find((r) => r.resourceId === pr.resourceId);
        if (er) {
          clashingResources.push(pr.name || pr.resourceId);
        }
      }

      if (clashingResources.length > 0) {
        const score = calculateConflictScore(
          "RESOURCE_CLASH",
          overlapMins,
          proposedDuration,
          DEFAULT_CONFLICT_WEIGHTS
        );
        conflicts.push({
          type: "RESOURCE_CLASH",
          severity: mapScoreToSeverity(score),
          conflictingEventId: existing.id,
          message: `Resource clash: simultaneous booking for ${clashingResources.join(", ")} with "${existing.title}".`,
          overlapMinutes: overlapMins,
          score,
        });
      }
    }

    // 4. SAME STUDENT GROUP AT TWO EVENTS
    if (
      isOverlapping &&
      proposed.attendeesGroup &&
      existing.attendeesGroup &&
      proposed.attendeesGroup.length > 0 &&
      existing.attendeesGroup.length > 0
    ) {
      const commonGroups = proposed.attendeesGroup.filter((group) =>
        existing.attendeesGroup?.includes(group)
      );

      if (commonGroups.length > 0) {
        const score = calculateConflictScore(
          "STUDENT_GROUP_OVERLAP",
          overlapMins,
          proposedDuration,
          DEFAULT_CONFLICT_WEIGHTS
        );
        conflicts.push({
          type: "STUDENT_GROUP_OVERLAP",
          severity: mapScoreToSeverity(score),
          conflictingEventId: existing.id,
          message: `Student group overlap: target audience [${commonGroups.join(", ")}] overlaps with "${existing.title}".`,
          overlapMinutes: overlapMins,
          score,
        });
      }
    }

    // 5. BACK-TO-BACK WITH NO BUFFER (Configurable buffer, default 15 min)
    // Only applies if events DO NOT overlap, but are at the same venue or organized by the same person
    if (!isOverlapping && (proposed.venueId === existing.venueId || proposed.organizerId === existing.organizerId)) {
      let gapMinutes = -1;

      // Existing precedes Proposed
      if (endE <= startP) {
        gapMinutes = Math.round((startP.getTime() - endE.getTime()) / (1000 * 60));
      }
      // Proposed precedes Existing
      else if (endP <= startE) {
        gapMinutes = Math.round((startE.getTime() - endP.getTime()) / (1000 * 60));
      }

      if (gapMinutes >= 0 && gapMinutes < bufferMinutes) {
        const violatedGap = bufferMinutes - gapMinutes;
        const score = calculateConflictScore(
          "BUFFER_VIOLATION",
          violatedGap,
          bufferMinutes,
          DEFAULT_CONFLICT_WEIGHTS
        );
        conflicts.push({
          type: "BUFFER_VIOLATION",
          severity: mapScoreToSeverity(score),
          conflictingEventId: existing.id,
          message: `Buffer violation: only ${gapMinutes}m gap between "${existing.title}" and this event (minimum required: ${bufferMinutes}m).`,
          overlapMinutes: gapMinutes,
          score,
        });
      }
    }
  }

  return conflicts;
}
