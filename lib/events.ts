import { prisma } from "@/src/lib/prisma";
import type { CampusEvent, ConflictSeverity, EventStatus, EventType, ReviewItem } from "@/lib/types/event";

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
