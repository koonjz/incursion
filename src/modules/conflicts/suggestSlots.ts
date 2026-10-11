import { ExistingEvent, SuggestedSlotResult } from "./types";
import { APP_CONFIG } from "@/src/config";

export interface SuggestSlotOptions {
  workingHourStart?: number;
  workingHourEnd?: number;
  skipWeekends?: boolean;
  bufferMinutes?: number;
  searchDaysAhead?: number;
  maxSuggestions?: number;
  stepMinutes?: number;
}

/**
 * Generates top free slots for an event at a venue.
 * Ranks candidates by proximity to the originally requested time.
 */
export function suggestFreeSlots(
  venueId: string,
  durationMinutes: number,
  requestedStart: Date | string,
  existingEvents: ExistingEvent[],
  options: SuggestSlotOptions = {}
): SuggestedSlotResult[] {
  const {
    workingHourStart = APP_CONFIG.conflicts.workingHours.start,
    workingHourEnd = APP_CONFIG.conflicts.workingHours.end,
    skipWeekends = true,
    bufferMinutes = APP_CONFIG.conflicts.defaultBufferMinutes,
    searchDaysAhead = 5,
    maxSuggestions = 5,
    stepMinutes = 30,
  } = options;

  const targetDate = new Date(requestedStart);
  if (isNaN(targetDate.getTime()) || durationMinutes <= 0) {
    return [];
  }

  const requestedTimeMs = targetDate.getTime();
  const venueEvents = existingEvents.filter(
    (e) => e.venueId === venueId && e.status !== "REJECTED" && e.status !== "rejected"
  );

  const candidateSlots: {
    start: Date;
    end: Date;
    diffMinutes: number;
  }[] = [];

  for (let dayOffset = 0; dayOffset <= searchDaysAhead; dayOffset++) {
    const currentDay = new Date(targetDate);
    currentDay.setDate(targetDate.getDate() + dayOffset);

    // Skip weekends if configured (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentDay.getDay();
    if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    const dayStart = new Date(currentDay);
    dayStart.setHours(workingHourStart, 0, 0, 0);

    const dayEnd = new Date(currentDay);
    dayEnd.setHours(workingHourEnd, 0, 0, 0);

    // Maximum possible start time for this slot today
    const latestStartMs = dayEnd.getTime() - durationMinutes * 60 * 1000;

    let candidateStartMs = dayStart.getTime();

    while (candidateStartMs <= latestStartMs) {
      const candidateEndMs = candidateStartMs + durationMinutes * 60 * 1000;
      const candStart = new Date(candidateStartMs);
      const candEnd = new Date(candidateEndMs);

      // Check conflict with any existing event in this venue
      let hasConflict = false;

      for (const ev of venueEvents) {
        const evStart = new Date(ev.start);
        const evEnd = new Date(ev.end);

        // Direct overlap: startA < endB && startB < endA
        if (candStart < evEnd && evStart < candEnd) {
          hasConflict = true;
          break;
        }

        // Buffer violation
        if (evEnd <= candStart) {
          const gap = (candStart.getTime() - evEnd.getTime()) / (1000 * 60);
          if (gap < bufferMinutes) {
            hasConflict = true;
            break;
          }
        } else if (candEnd <= evStart) {
          const gap = (evStart.getTime() - candEnd.getTime()) / (1000 * 60);
          if (gap < bufferMinutes) {
            hasConflict = true;
            break;
          }
        }
      }

      if (!hasConflict) {
        const diffMinutes = Math.abs(
          Math.round((candidateStartMs - requestedTimeMs) / (1000 * 60))
        );

        candidateSlots.push({
          start: candStart,
          end: candEnd,
          diffMinutes,
        });
      }

      candidateStartMs += stepMinutes * 60 * 1000;
    }
  }

  // Sort candidate slots by closeness to originally requested time
  candidateSlots.sort((a, b) => a.diffMinutes - b.diffMinutes);

  const topCandidates = candidateSlots.slice(0, maxSuggestions);

  return topCandidates.map((slot, index) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = slot.start.getFullYear();
    const month = pad(slot.start.getMonth() + 1);
    const day = pad(slot.start.getDate());
    const dateStr = `${year}-${month}-${day}`;
    const startStr = `${pad(slot.start.getHours())}:${pad(slot.start.getMinutes())}`;
    const endStr = `${pad(slot.end.getHours())}:${pad(slot.end.getMinutes())}`;

    return {
      id: `slot-${index + 1}`,
      start: slot.start,
      end: slot.end,
      date: dateStr,
      startTime: startStr,
      endTime: endStr,
      venueId,
      scoreDifferenceMinutes: slot.diffMinutes,
      isRecommended: index === 0,
    };
  });
}
