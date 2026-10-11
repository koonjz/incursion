import { prisma } from "@/src/lib/prisma";

/**
 * Escapes CSV cells per RFC 4180 standard:
 * - If value contains commas, double quotes, or newlines, wrap in quotes.
 * - Any internal double quotes are escaped as two double quotes ("").
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an event summary report JSON.
 */
export async function getEventSummaryReport(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: true,
      organizer: { select: { id: true, name: true, email: true, department: true } },
      resources: { include: { resource: true } },
      budget: true,
      expenses: {
        include: { createdBy: { select: { name: true } }, receipt: true },
      },
      conflictLogs: { include: { resolvedBy: { select: { name: true } } } },
      reviews: { include: { reviewer: { select: { name: true, role: true } } } },
    },
  });

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }

  const totalAllocated = event.budget?.allocated ?? 0;
  const totalSpent = event.expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      status: event.status,
      startTime: event.startTime,
      endTime: event.endTime,
      expectedAttendance: event.expectedAttendance,
      venue: event.venue.name,
      organizer: event.organizer.name,
      department: event.organizer.department,
    },
    financials: {
      allocatedBudget: totalAllocated,
      totalSpent,
      remaining: Math.max(0, totalAllocated - totalSpent),
      percentageUsed: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
      expenseCount: event.expenses.length,
    },
    resources: event.resources.map((r) => ({
      name: r.resource.name,
      type: r.resource.type,
      quantity: r.quantity,
    })),
    conflicts: event.conflictLogs.map((c) => ({
      type: c.conflictType,
      severity: c.severity,
      score: c.score,
      resolvedAt: c.resolvedAt,
      resolvedBy: c.resolvedBy?.name,
    })),
    reviews: event.reviews.map((r) => ({
      reviewer: r.reviewer.name,
      role: r.reviewer.role,
      decision: r.decision,
      comment: r.comment,
      date: r.createdAt,
    })),
  };
}

/**
 * Generates a formatted CSV string of event budgets and expenses.
 */
export async function generateBudgetCsv(filters: { from?: string; to?: string }) {
  const where: Record<string, unknown> = {};

  if (filters.from || filters.to) {
    const timeFilter: Record<string, Date> = {};
    if (filters.from) timeFilter.gte = new Date(filters.from);
    if (filters.to) timeFilter.lte = new Date(filters.to);
    where.createdAt = timeFilter;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        include: {
          venue: true,
          budget: true,
        },
      },
      createdBy: true,
      receipt: true,
    },
  });

  const headers = [
    "Expense ID",
    "Event ID",
    "Event Title",
    "Venue",
    "Allocated Budget",
    "Expense Title",
    "Category",
    "Amount",
    "Status",
    "Submitted By",
    "Has Receipt",
    "Created Date",
  ];

  const rows = expenses.map((exp) => [
    escapeCsvCell(exp.id),
    escapeCsvCell(exp.eventId),
    escapeCsvCell(exp.event.title),
    escapeCsvCell(exp.event.venue.name),
    escapeCsvCell(exp.event.budget?.allocated ?? 0),
    escapeCsvCell(exp.title),
    escapeCsvCell(exp.category),
    escapeCsvCell(exp.amount),
    escapeCsvCell(exp.status),
    escapeCsvCell(exp.createdBy.name),
    escapeCsvCell(exp.receiptId ? "Yes" : "No"),
    escapeCsvCell(exp.createdAt.toISOString()),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Generates a formatted CSV string of conflict logs for audit.
 */
export async function generateConflictsCsv() {
  const conflicts = await prisma.conflictLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        include: {
          venue: true,
          organizer: true,
        },
      },
      resolvedBy: true,
    },
  });

  const headers = [
    "Conflict ID",
    "Event ID",
    "Event Title",
    "Venue",
    "Organizer",
    "Conflict Type",
    "Severity",
    "Score",
    "Status",
    "Resolved By",
    "Resolved Date",
    "Created Date",
  ];

  const rows = conflicts.map((c) => [
    escapeCsvCell(c.id),
    escapeCsvCell(c.eventId),
    escapeCsvCell(c.event.title),
    escapeCsvCell(c.event.venue.name),
    escapeCsvCell(c.event.organizer.name),
    escapeCsvCell(c.conflictType),
    escapeCsvCell(c.severity),
    escapeCsvCell(c.score),
    escapeCsvCell(c.resolvedAt ? "Resolved" : "Active"),
    escapeCsvCell(c.resolvedBy?.name ?? "N/A"),
    escapeCsvCell(c.resolvedAt ? c.resolvedAt.toISOString() : "N/A"),
    escapeCsvCell(c.createdAt.toISOString()),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
