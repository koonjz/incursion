import { prisma } from "@/src/lib/prisma";
import type { CampusEvent, ConflictSeverity, EventStatus, EventType, ReviewItem } from "@/lib/types/event";

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  // Technical Events
  { value: "Workshop", label: "Technical Workshop" },
  { value: "Hackathon", label: "Hackathon" },
  { value: "Technical Talk", label: "Technical Talk" },
  { value: "Guest Lecture", label: "Guest Lecture" },
  { value: "Bootcamp", label: "Bootcamp" },
  { value: "Ideathon", label: "Ideathon" },
  { value: "Project Exhibition", label: "Project Exhibition" },

  // Academic Events
  { value: "Symposium", label: "Symposium" },
  { value: "Conference", label: "Conference" },
  { value: "Seminar", label: "Seminar" },
  { value: "Academic Talk", label: "Academic Talk" },

  // Competitions
  { value: "Competition", label: "Competition" },
  { value: "Coding Competition", label: "Coding Competition" },
  { value: "Quiz", label: "Quiz Competition" },
  { value: "Case Study", label: "Case Study Competition" },

  // Cultural Events
  { value: "Cultural", label: "Cultural Event" },
  { value: "Cultural Fest", label: "Cultural Fest" },
  { value: "Music", label: "Music Event" },
  { value: "Dance", label: "Dance Competition" },
  { value: "Art & Design", label: "Art & Design Workshop" },
  { value: "Photography", label: "Photography Workshop" },
  { value: "Literary", label: "Literary Event" },
  { value: "Open Mic", label: "Open Mic" },

  // Student Activities
  { value: "Networking", label: "Networking Event" },
  { value: "General Meeting", label: "Club Meeting" },
  { value: "Club Recruitment", label: "Club Recruitment" },
  { value: "Orientation", label: "Orientation" },
  { value: "Alumni Talk", label: "Alumni Talk" },
  { value: "Panel Discussion", label: "Panel Discussion" },
  { value: "Awareness Campaign", label: "Awareness Campaign" },

  // Sports & Other Events
  { value: "Sports", label: "Sports Event" },
  { value: "Sports Tournament", label: "Sports Tournament" },
  { value: "Social", label: "Social Event" },
  { value: "Other", label: "Other" },
];

export const AUDIENCE_OPTIONS = [
  "CSE",
  "ECE",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "First Year",
  "Second Year",
  "Third Year",
  "Final Year",
  "UG Students",
  "PG Students",
  "PhD Scholars",
  "Engineering",
  "Technical",
  "General",
];

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

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function mapPrismaEventToCampusEvent(e: any): CampusEvent {
  const startDate = new Date(e.startTime);
  const endDate = new Date(e.endTime);

  const dateStr = `${startDate.getUTCFullYear()}-${pad(startDate.getUTCMonth() + 1)}-${pad(startDate.getUTCDate())}`;
  const startStr = `${pad(startDate.getUTCHours())}:${pad(startDate.getUTCMinutes())}`;
  const endStr = `${pad(endDate.getUTCHours())}:${pad(endDate.getUTCMinutes())}`;

  const statusMap: Record<string, EventStatus> = {
    DRAFT: "draft",
    PENDING: "pending",
    APPROVED: "approved",
    CHANGES_REQUESTED: "changes_requested",
    REJECTED: "rejected",
  };

  const severityMap: Record<string, ConflictSeverity> = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    NONE: "none",
  };

  const reviews: ReviewItem[] = (e.reviews || []).map((r: any) => ({
    id: r.id,
    reviewerName: r.reviewer?.name || "Reviewer",
    reviewerRole: r.reviewer?.role || "ACM Core",
    decision: statusMap[r.decision] || "submitted",
    comment: r.comment || "",
    timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    changesRequested: r.changesRequested || [],
  }));

  return {
    id: e.id,
    title: e.title,
    eventType: (e.eventType as EventType) || "Workshop",
    organizer: e.organizer?.name || "Organizer",
    club: e.organizer?.department || "General",
    date: dateStr,
    startTime: startStr,
    endTime: endStr,
    venue: e.venue?.name || "Campus Venue",
    expectedAttendance: e.expectedAttendance || 0,
    audience: e.attendeesGroup || [],
    description: e.description || "",
    status: statusMap[e.status] || "pending",
    conflictSeverity: severityMap[e.conflictSeverity] || "none",
    conflictId: e.conflictLogs?.[0]?.id,
    submittedAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : new Date().toISOString(),
    submitterName: e.organizer?.name || "Organizer",
    submitterEmail: e.organizer?.email || "organizer@campus.edu",
    reviews,
  };
}

/** Verified events only — what the public landing page shows. Fetches directly from Neon. */
export async function getPublicEvents(): Promise<CampusEvent[]> {
  try {
    const events = await prisma.event.findMany({
      where: { status: "APPROVED" },
      include: {
        venue: true,
        organizer: true,
        conflictLogs: true,
        reviews: { include: { reviewer: true } },
      },
      orderBy: { startTime: "asc" },
    });
    return events.map(mapPrismaEventToCampusEvent);
  } catch (err) {
    console.error("Failed to fetch public events from Neon:", err);
    return [];
  }
}

/** Fetches all events from Neon database. */
export async function getAllCampusEvents(): Promise<CampusEvent[]> {
  try {
    const events = await prisma.event.findMany({
      include: {
        venue: true,
        organizer: true,
        conflictLogs: true,
        reviews: { include: { reviewer: true } },
      },
      orderBy: { startTime: "asc" },
    });
    return events.map(mapPrismaEventToCampusEvent);
  } catch (err) {
    console.error("Failed to fetch events from Neon:", err);
    return [];
  }
}

/** Fetches all venues from Neon database. */
export async function getAllVenues() {
  try {
    return await prisma.venue.findMany({ orderBy: { name: "asc" } });
  } catch {
    return [];
  }
}

/** Match a short venue name ("LT-2") to the full venue option label. */
export function resolveVenueName(venue: string, options: { name: string }[]): string {
  const exact = options.find((o) => o.name === venue);
  if (exact) return exact.name;
  const loose = options.find((o) => o.name.startsWith(venue) || venue.startsWith(o.name.split(" ")[0]));
  return loose?.name ?? venue;
}
