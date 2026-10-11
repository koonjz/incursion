import { describe, it, expect } from "vitest";
import { suggestFreeSlots } from "@/src/modules/conflicts/suggestSlots";
import { ExistingEvent } from "@/src/modules/conflicts/types";

describe("suggestSlots - Free Slot Generation", () => {
  const existingEvents: ExistingEvent[] = [
    {
      id: "evt-1",
      title: "Morning Keynote",
      start: new Date("2026-10-15T09:00:00Z"),
      end: new Date("2026-10-15T11:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-1",
    },
    {
      id: "evt-2",
      title: "Afternoon Workshop",
      start: new Date("2026-10-15T14:00:00Z"),
      end: new Date("2026-10-15T16:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    },
  ];

  it("suggests up to 5 valid free slots within working hours", () => {
    const requested = new Date("2026-10-15T10:00:00Z"); // clashes with Morning Keynote
    const suggestions = suggestFreeSlots("ven-lt2", 60, requested, existingEvents, {
      workingHourStart: 8,
      workingHourEnd: 20,
      skipWeekends: true,
      maxSuggestions: 5,
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(5);

    // Each slot must be 60 minutes long
    for (const slot of suggestions) {
      const durationMins = Math.round((slot.end.getTime() - slot.start.getTime()) / (1000 * 60));
      expect(durationMins).toBe(60);
      expect(slot.start.getHours()).toBeGreaterThanOrEqual(8);
      expect(slot.end.getHours()).toBeLessThanOrEqual(20);
    }
  });

  it("ranks slots by proximity to requested time", () => {
    const requested = new Date("2026-10-15T12:00:00Z");
    const suggestions = suggestFreeSlots("ven-lt2", 60, requested, existingEvents, {
      maxSuggestions: 3,
    });

    expect(suggestions[0].isRecommended).toBe(true);
    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i].scoreDifferenceMinutes).toBeLessThanOrEqual(
        suggestions[i + 1].scoreDifferenceMinutes
      );
    }
  });

  it("skips weekend slots when skipWeekends is enabled", () => {
    // 2026-10-17 is a Saturday
    const requestedSaturday = new Date("2026-10-17T10:00:00Z");
    const suggestions = suggestFreeSlots("ven-lt2", 60, requestedSaturday, [], {
      skipWeekends: true,
      searchDaysAhead: 3,
    });

    for (const slot of suggestions) {
      const day = slot.start.getDay();
      expect(day).not.toBe(0); // Not Sunday
      expect(day).not.toBe(6); // Not Saturday
    }
  });

  it("generates slots cleanly on an empty calendar", () => {
    const requested = new Date("2026-10-15T10:00:00Z");
    const suggestions = suggestFreeSlots("ven-lt2", 90, requested, []);
    expect(suggestions.length).toBe(5);
    expect(suggestions[0].isRecommended).toBe(true);
  });

  it("returns empty array for invalid requested dates or durations", () => {
    expect(suggestFreeSlots("ven-lt2", -10, new Date(), [])).toEqual([]);
    expect(suggestFreeSlots("ven-lt2", 60, "invalid-date", [])).toEqual([]);
  });
});
