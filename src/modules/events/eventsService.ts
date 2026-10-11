import { prisma } from "@/src/lib/prisma";
import { detectConflicts } from "@/src/modules/conflicts/detectConflicts";
import { calculateOverallScore, mapScoreToSeverity } from "@/src/modules/conflicts/severity";
import { suggestFreeSlots } from "@/src/modules/conflicts/suggestSlots";
import { logConflicts } from "@/src/modules/conflicts/conflictLogService";
import { emailSender } from "@/src/modules/notifications/emailService";
import { AuthenticatedUser } from "@/src/modules/auth/rbac";
import {
  CheckConflictsInput,
  CreateEventInput,
  ReviewEventInput,
  UpdateEventInput,
} from "./validation";
import { EventStatus, Severity } from "@prisma/client";
import { ExistingEvent } from "@/src/modules/conflicts/types";

/**
 * Loads active existing events for conflict checking.
 */
export async function loadExistingEventsForCheck(
  startTime: Date,
  endTime: Date
): Promise<ExistingEvent[]> {
  // Query window: 1 day before to 1 day after for buffer detection
  const windowStart = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      status: { notIn: [EventStatus.REJECTED] },
      startTime: { lte: windowEnd },
      endTime: { gte: windowStart },
    },
    include: {
      resources: {
        include: {
          resource: true,
        },
      },
    },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    venueId: e.venueId,
    organizerId: e.organizerId,
    status: e.status,
    attendeesGroup: e.attendeesGroup,
    resources: e.resources.map((r) => ({
      resourceId: r.resourceId,
      name: r.resource.name,
      quantity: r.quantity,
    })),
  }));
}

/**
 * Performs dry-run conflict check + generates free slot suggestions.
 */
export async function dryRunConflictCheck(input: CheckConflictsInput) {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  const existing = await loadExistingEventsForCheck(start, end);

  const conflicts = detectConflicts(
    {
      id: input.id,
      start,
      end,
      venueId: input.venueId,
      organizerId: input.organizerId || "",
      resources: input.resources,
      attendeesGroup: input.attendeesGroup,
    },
    existing
  );

  const overallScore = calculateOverallScore(conflicts.map((c) => c.score || 0));
  const overallSeverity = mapScoreToSeverity(overallScore);

  const suggestedSlots =
    conflicts.length > 0
      ? suggestFreeSlots(input.venueId, duration, start, existing)
      : [];

  return {
    conflicts,
    overallScore,
    overallSeverity,
    suggestedSlots,
  };
}

/**
 * Creates a new event with conflict detection, budget allocation, and notification.
 */
export async function createEvent(
  input: CreateEventInput,
  currentUser: AuthenticatedUser
) {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  const existing = await loadExistingEventsForCheck(start, end);

  const conflicts = detectConflicts(
    {
      start,
      end,
      venueId: input.venueId,
      organizerId: currentUser.id,
      resources: input.resources,
      attendeesGroup: input.attendeesGroup,
    },
    existing
  );

  const overallScore = calculateOverallScore(conflicts.map((c) => c.score || 0));
  const overallSeverity = mapScoreToSeverity(overallScore);

  const hasCriticalConflict =
    overallSeverity === "CRITICAL" ||
    conflicts.some((c) => c.severity === "CRITICAL");

  // Block creation if CRITICAL conflict exists and user is not an ADMIN override
  if (hasCriticalConflict && !input.overrideConflict) {
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const suggestedSlots = suggestFreeSlots(input.venueId, duration, start, existing);

    const error = new Error("CRITICAL_CONFLICT_BLOCKED");
    (error as unknown as { conflicts: typeof conflicts; suggestedSlots: typeof suggestedSlots }).conflicts = conflicts;
    (error as unknown as { conflicts: typeof conflicts; suggestedSlots: typeof suggestedSlots }).suggestedSlots = suggestedSlots;
    throw error;
  }

  // Persist event in Prisma
  const event = await prisma.event.create({
    data: {
      title: input.title,
      description: input.description,
      eventType: input.eventType,
      startTime: start,
      endTime: end,
      venueId: input.venueId,
      organizerId: currentUser.id,
      expectedAttendance: input.expectedAttendance,
      attendeesGroup: input.attendeesGroup,
      conflictSeverity: overallSeverity as Severity,
      status: EventStatus.PENDING,
      overrideReason: input.overrideConflict ? input.overrideReason : undefined,
      resources: input.resources && input.resources.length > 0
        ? {
            create: input.resources.map((r) => ({
              resourceId: r.resourceId,
              quantity: r.quantity,
            })),
          }
        : undefined,
      budget: input.budgetAllocated && input.budgetAllocated > 0
        ? {
            create: {
              allocated: input.budgetAllocated,
              notes: input.description || input.title,
            },
          }
        : undefined,
    },
    include: {
      venue: true,
      organizer: {
        select: { id: true, name: true, email: true },
      },
      resources: {
        include: { resource: true },
      },
      budget: true,
    },
  });

  // Persist conflict logs if any detected
  if (conflicts.length > 0) {
    await logConflicts(event.id, conflicts);

    // Send conflict alert email
    await emailSender.sendConflictAlert({
      to: currentUser.email,
      eventName: event.title,
      conflictType: conflicts.map((c) => c.type).join(", "),
      severity: overallSeverity,
      details: conflicts.map((c) => c.message).join("\n"),
    });
  }

  return { event, conflicts, overallSeverity };
}

/**
 * Lists events with query filtering.
 */
export async function listEvents(filters: {
  from?: string;
  to?: string;
  venueId?: string;
  status?: EventStatus;
  organizerId?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters.venueId) where.venueId = filters.venueId;
  if (filters.status) where.status = filters.status;
  if (filters.organizerId) where.organizerId = filters.organizerId;

  if (filters.from || filters.to) {
    const timeFilter: Record<string, Date> = {};
    if (filters.from) timeFilter.gte = new Date(filters.from);
    if (filters.to) timeFilter.lte = new Date(filters.to);
    where.startTime = timeFilter;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return await prisma.event.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      venue: true,
      organizer: {
        select: { id: true, name: true, email: true },
      },
      budget: true,
      _count: {
        select: { expenses: true, conflictLogs: true },
      },
    },
  });
}

/**
 * Gets event details by ID.
 */
export async function getEventById(id: string) {
  return await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      organizer: {
        select: { id: true, name: true, email: true },
      },
      resources: {
        include: { resource: true },
      },
      budget: true,
      expenses: {
        include: { receipt: true },
      },
      conflictLogs: {
        include: { resolvedBy: true },
      },
      reviews: {
        include: {
          reviewer: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
}

/**
 * Updates an event and re-evaluates conflicts.
 */
export async function updateEvent(
  id: string,
  input: UpdateEventInput,
  currentUser: AuthenticatedUser
) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  // Only organizer or admin/hod can update
  if (existing.organizerId !== currentUser.id && currentUser.role === "STUDENT") {
    throw new Error("FORBIDDEN");
  }

  const newStart = input.startTime ? new Date(input.startTime) : existing.startTime;
  const newEnd = input.endTime ? new Date(input.endTime) : existing.endTime;
  const newVenueId = input.venueId || existing.venueId;

  const existingCalendar = await loadExistingEventsForCheck(newStart, newEnd);

  const conflicts = detectConflicts(
    {
      id,
      start: newStart,
      end: newEnd,
      venueId: newVenueId,
      organizerId: existing.organizerId,
      resources: input.resources,
      attendeesGroup: input.attendeesGroup || existing.attendeesGroup,
    },
    existingCalendar
  );

  const overallScore = calculateOverallScore(conflicts.map((c) => c.score || 0));
  const overallSeverity = mapScoreToSeverity(overallScore);

  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      eventType: input.eventType,
      startTime: newStart,
      endTime: newEnd,
      venueId: newVenueId,
      expectedAttendance: input.expectedAttendance,
      attendeesGroup: input.attendeesGroup,
      conflictSeverity: overallSeverity as Severity,
      overrideReason: input.overrideReason,
    },
    include: {
      venue: true,
      organizer: true,
    },
  });

  if (conflicts.length > 0) {
    await logConflicts(id, conflicts);
  }

  return { event: updated, conflicts, overallSeverity };
}

/**
 * Deletes an event.
 */
export async function deleteEvent(id: string, currentUser: AuthenticatedUser) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  if (existing.organizerId !== currentUser.id && !["ADMIN", "HOD"].includes(currentUser.role)) {
    throw new Error("FORBIDDEN");
  }

  return await prisma.event.delete({ where: { id } });
}

/**
 * Reviews an event (Approve, Reject, Request Changes) - HOD / Admin role only.
 */
export async function reviewEvent(
  id: string,
  input: ReviewEventInput,
  reviewer: AuthenticatedUser
) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { organizer: true },
  });

  if (!event) {
    throw new Error("NOT_FOUND");
  }

  const review = await prisma.review.create({
    data: {
      eventId: id,
      reviewerId: reviewer.id,
      decision: input.decision as EventStatus,
      comment: input.comment,
      changesRequested: input.changesRequested || [],
    },
  });

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      status: input.decision as EventStatus,
      overrideReason: input.overrideConflict ? `Reviewer override by ${reviewer.name}` : undefined,
    },
    include: {
      venue: true,
      organizer: true,
    },
  });

  // Send email notification to event organizer
  await emailSender.sendReviewDecision({
    to: event.organizer.email,
    eventName: event.title,
    decision: input.decision,
    reviewerName: reviewer.name,
    comment: input.comment,
  });

  return { review, event: updatedEvent };
}
