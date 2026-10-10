import { ConflictSeverity } from "./event";

export interface ConflictReason {
  id: string;
  code: "TIME_OVERLAP" | "SAME_VENUE" | "AUDIENCE_OVERLAP" | "SIMILAR_TYPE" | "CAPACITY_OVERLOAD";
  title: string;
  detail: string;
  severity: ConflictSeverity;
}

export interface SuggestedSlot {
  id: string;
  date: string;
  startTime: string; // e.g. "15:00"
  endTime: string;   // e.g. "17:00"
  startTimeFormatted: string; // "3:00 PM"
  endTimeFormatted: string;   // "5:00 PM"
  venue: string;
  rationale: string;
  isRecommended?: boolean;
}

export interface EventSlotComparison {
  title: string;
  organizer: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  expectedAttendance: number;
  audience: string[];
  eventType: string;
}

export interface EventConflict {
  id: string;
  targetEventId: string;
  competingEventId: string;
  severity: ConflictSeverity;
  headline: string;
  summary: string;
  overlapMinutes: number;
  overlapWindow: string; // e.g. "5:30 PM — 7:00 PM"
  yourEvent: EventSlotComparison;
  competingEvent: EventSlotComparison;
  reasons: ConflictReason[];
  suggestedSlots: SuggestedSlot[];
  checks: {
    venueAvailable: boolean;
    organizerAvailable: boolean;
    audienceClear: boolean;
    timeClear: boolean;
  };
}
