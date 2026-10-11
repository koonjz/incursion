import { describe, it, expect } from "vitest";
import { detectConflicts, getOverlapMinutes } from "@/src/modules/conflicts/detectConflicts";
import { ExistingEvent, ProposedEvent } from "@/src/modules/conflicts/types";

describe("detectConflicts - Conflict Detection Engine", () => {
  const baseExisting: ExistingEvent = {
    id: "evt-existing-1",
    title: "IEEE Symposium",
    start: new Date("2026-10-15T14:00:00Z"),
    end: new Date("2026-10-15T16:00:00Z"),
    venueId: "ven-lt2",
    organizerId: "usr-org-1",
    resources: [{ resourceId: "res-proj-4k", name: "4K Projector", quantity: 1 }],
    attendeesGroup: ["CSE", "ECE"],
  };

  // 1. Exact overlap
  it("detects exact venue overlap", () => {
    const proposed: ProposedEvent = {
      start: new Date("2026-10-15T14:00:00Z"),
      end: new Date("2026-10-15T16:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposed, [baseExisting]);
    expect(conflicts.length).toBeGreaterThan(0);
    const venueConflict = conflicts.find((c) => c.type === "VENUE_OVERLAP");
    expect(venueConflict).toBeDefined();
    expect(venueConflict?.overlapMinutes).toBe(120);
    expect(venueConflict?.severity).toBe("CRITICAL");
  });

  // 2. Partial overlap
  it("detects partial venue overlap", () => {
    const proposed: ProposedEvent = {
      start: new Date("2026-10-15T15:00:00Z"),
      end: new Date("2026-10-15T17:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposed, [baseExisting]);
    const venueConflict = conflicts.find((c) => c.type === "VENUE_OVERLAP");
    expect(venueConflict).toBeDefined();
    expect(venueConflict?.overlapMinutes).toBe(60);
  });

  // 3. Touching boundaries (no conflict: 10:00-11:00 and 11:00-12:00)
  it("does NOT consider touching boundaries as a venue overlap", () => {
    const proposedDirectlyAfter: ProposedEvent = {
      start: new Date("2026-10-15T16:00:00Z"),
      end: new Date("2026-10-15T18:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposedDirectlyAfter, [baseExisting], 0);
    const venueConflict = conflicts.find((c) => c.type === "VENUE_OVERLAP");
    expect(venueConflict).toBeUndefined();
  });

  // 4. Contained event (Proposed fully inside Existing)
  it("detects conflict when proposed event is fully contained inside existing event", () => {
    const proposedContained: ProposedEvent = {
      start: new Date("2026-10-15T14:30:00Z"),
      end: new Date("2026-10-15T15:30:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposedContained, [baseExisting]);
    const venueConflict = conflicts.find((c) => c.type === "VENUE_OVERLAP");
    expect(venueConflict).toBeDefined();
    expect(venueConflict?.overlapMinutes).toBe(60);
  });

  // 5. Existing event fully contained inside Proposed event
  it("detects conflict when existing event is fully engulfed by proposed event", () => {
    const proposedEngulfing: ProposedEvent = {
      start: new Date("2026-10-15T13:00:00Z"),
      end: new Date("2026-10-15T17:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposedEngulfing, [baseExisting]);
    const venueConflict = conflicts.find((c) => c.type === "VENUE_OVERLAP");
    expect(venueConflict).toBeDefined();
    expect(venueConflict?.overlapMinutes).toBe(120);
  });

  // 6. Multi-day event spanning across days
  it("detects conflict for multi-day event spanning across existing event", () => {
    const proposedMultiDay: ProposedEvent = {
      start: new Date("2026-10-14T10:00:00Z"),
      end: new Date("2026-10-16T18:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposedMultiDay, [baseExisting]);
    const venueConflict = conflicts.find((c) => c.type === "VENUE_OVERLAP");
    expect(venueConflict).toBeDefined();
    expect(venueConflict?.overlapMinutes).toBe(120);
  });

  // 7. Back-to-back buffer violation (< 15 min gap)
  it("detects buffer violation when gap is less than default 15 minutes", () => {
    const proposedWith10MinGap: ProposedEvent = {
      start: new Date("2026-10-15T16:10:00Z"), // 10 minutes after 16:00
      end: new Date("2026-10-15T18:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposedWith10MinGap, [baseExisting], 15);
    const bufferConflict = conflicts.find((c) => c.type === "BUFFER_VIOLATION");
    expect(bufferConflict).toBeDefined();
    expect(bufferConflict?.overlapMinutes).toBe(10);
  });

  // 8. Buffer compliant (>= 15 min gap)
  it("allows events with buffer >= configured buffer minutes", () => {
    const proposedCompliant: ProposedEvent = {
      start: new Date("2026-10-15T16:15:00Z"), // exactly 15 minutes gap
      end: new Date("2026-10-15T18:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-2",
    };
    const conflicts = detectConflicts(proposedCompliant, [baseExisting], 15);
    expect(conflicts.length).toBe(0);
  });

  // 9. Resource clash
  it("detects resource clash for simultaneous equipment booking", () => {
    const proposedResourceClash: ProposedEvent = {
      start: new Date("2026-10-15T14:30:00Z"),
      end: new Date("2026-10-15T16:30:00Z"),
      venueId: "ven-different-audi", // different venue
      organizerId: "usr-different-org",
      resources: [{ resourceId: "res-proj-4k", name: "4K Projector", quantity: 1 }],
    };
    const conflicts = detectConflicts(proposedResourceClash, [baseExisting]);
    const resConflict = conflicts.find((c) => c.type === "RESOURCE_CLASH");
    expect(resConflict).toBeDefined();
    expect(resConflict?.message).toContain("4K Projector");
  });

  // 10. Organizer double-booking
  it("detects organizer double-booking even across different venues", () => {
    const proposedDoubleBooking: ProposedEvent = {
      start: new Date("2026-10-15T14:30:00Z"),
      end: new Date("2026-10-15T15:30:00Z"),
      venueId: "ven-turing", // different venue
      organizerId: "usr-org-1", // SAME organizer as baseExisting
    };
    const conflicts = detectConflicts(proposedDoubleBooking, [baseExisting]);
    const orgConflict = conflicts.find((c) => c.type === "ORGANIZER_DOUBLE_BOOKING");
    expect(orgConflict).toBeDefined();
    expect(orgConflict?.message).toContain("Organizer double-booking");
  });

  // 11. Same student group at two overlapping events
  it("detects student group cohort conflict", () => {
    const proposedGroupOverlap: ProposedEvent = {
      start: new Date("2026-10-15T14:30:00Z"),
      end: new Date("2026-10-15T15:30:00Z"),
      venueId: "ven-sac1",
      organizerId: "usr-org-3",
      attendeesGroup: ["CSE", "Design"], // "CSE" overlaps with baseExisting
    };
    const conflicts = detectConflicts(proposedGroupOverlap, [baseExisting]);
    const groupConflict = conflicts.find((c) => c.type === "STUDENT_GROUP_OVERLAP");
    expect(groupConflict).toBeDefined();
    expect(groupConflict?.message).toContain("CSE");
  });

  // 12. Empty calendar produces zero conflicts
  it("returns zero conflicts when calendar is empty", () => {
    const proposed: ProposedEvent = {
      start: new Date("2026-10-15T14:00:00Z"),
      end: new Date("2026-10-15T16:00:00Z"),
      venueId: "ven-lt2",
      organizerId: "usr-org-1",
    };
    const conflicts = detectConflicts(proposed, []);
    expect(conflicts).toEqual([]);
  });

  // 13. Invalid date input handling (start >= end)
  it("handles invalid date input gracefully by returning empty array", () => {
    const invalidProposed: ProposedEvent = {
      start: new Date("2026-10-15T18:00:00Z"),
      end: new Date("2026-10-15T16:00:00Z"), // end is before start
      venueId: "ven-lt2",
      organizerId: "usr-org-1",
    };
    const conflicts = detectConflicts(invalidProposed, [baseExisting]);
    expect(conflicts).toEqual([]);
  });

  // 14. Helper function getOverlapMinutes calculation
  it("accurately calculates overlap duration in minutes", () => {
    const s1 = new Date("2026-10-15T10:00:00Z");
    const e1 = new Date("2026-10-15T12:00:00Z");
    const s2 = new Date("2026-10-15T11:00:00Z");
    const e2 = new Date("2026-10-15T13:00:00Z");
    expect(getOverlapMinutes(s1, e1, s2, e2)).toBe(60);
  });
});
