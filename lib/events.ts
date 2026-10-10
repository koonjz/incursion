import { MOCK_EVENTS } from "@/lib/mock/events";
import type { CampusEvent, ConflictSeverity, EventStatus, EventType } from "@/lib/types/event";

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "Workshop", label: "Workshop" },
  { value: "Symposium", label: "Symposium" },
  { value: "Hackathon", label: "Hackathon" },
  { value: "Guest Lecture", label: "Guest lecture" },
  { value: "Competition", label: "Competition" },
  { value: "Cultural", label: "Cultural" },
  { value: "Networking", label: "Networking" },
];

export const AUDIENCE_OPTIONS = ["CSE", "ECE", "First Year", "Engineering", "General", "Technical"];

export const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  pending: "In review",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export const SEVERITY_LABEL: Record<ConflictSeverity, string> = {
  critical: "Critical conflict",
  high: "Serious conflict",
  medium: "Possible conflict",
  low: "Minor note",
  none: "No conflicts",
};

function sortKey(e: CampusEvent) {
  return `${e.date}T${e.startTime}`;
}

/** Verified events only — what the public landing page shows. */
export function getPublicEvents(): CampusEvent[] {
  return MOCK_EVENTS.filter((e) => e.status === "approved").sort((a, b) =>
    sortKey(a).localeCompare(sortKey(b))
  );
}

/** Match a short venue name ("LT-2") to the full venue option label. */
export function resolveVenueName(venue: string, options: { name: string }[]): string {
  const exact = options.find((o) => o.name === venue);
  if (exact) return exact.name;
  const loose = options.find((o) => o.name.startsWith(venue) || venue.startsWith(o.name.split(" ")[0]));
  return loose?.name ?? venue;
}
