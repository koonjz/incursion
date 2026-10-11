export type ConflictType =
  | "VENUE_OVERLAP"
  | "ORGANIZER_DOUBLE_BOOKING"
  | "RESOURCE_CLASH"
  | "BUFFER_VIOLATION"
  | "STUDENT_GROUP_OVERLAP";

export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface EventResourceRequirement {
  resourceId: string;
  name?: string;
  quantity: number;
}

export interface ProposedEvent {
  id?: string;
  title?: string;
  start: Date | string;
  end: Date | string;
  venueId: string;
  organizerId: string;
  resources?: EventResourceRequirement[];
  attendeesGroup?: string[];
  bufferMinutes?: number;
}

export interface ExistingEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  venueId: string;
  organizerId: string;
  resources?: EventResourceRequirement[];
  attendeesGroup?: string[];
  status?: string;
}

export interface ConflictResult {
  type: ConflictType;
  severity: SeverityLevel;
  conflictingEventId: string;
  message: string;
  overlapMinutes: number;
  score?: number;
}

export interface ConflictWeightConfig {
  venue: number;
  organizer: number;
  resource: number;
  group: number;
  buffer: number;
}

export interface SuggestedSlotResult {
  id: string;
  start: Date;
  end: Date;
  startTime: string; // "14:00"
  endTime: string;   // "16:00"
  date: string;      // "YYYY-MM-DD"
  venueId: string;
  scoreDifferenceMinutes: number;
  isRecommended: boolean;
}
