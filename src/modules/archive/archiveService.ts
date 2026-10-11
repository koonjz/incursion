import { prisma } from "@/src/lib/prisma";
import { ExpenseCategory } from "@prisma/client";

export interface ArchiveSearchFilters {
  q?: string;
  from?: string;
  to?: string;
  venue?: string;
  category?: string;
  page?: number;
  limit?: number;
}

import { APP_CONFIG } from "@/src/config";

/**
 * Searches past events and expenses by keyword, date range, venue, and category.
 * Provides pagination, sorting, and item counters.
 */
export async function searchArchive(filters: ArchiveSearchFilters) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(
    APP_CONFIG.pagination.maxLimit,
    Math.max(1, filters.limit || APP_CONFIG.pagination.defaultLimit)
  );
  const skip = (page - 1) * limit;

  const now = new Date();

  // 1. EVENT SEARCH FILTERS
  const eventWhere: Record<string, unknown> = {
    // Past events
    endTime: { lt: now },
  };

  if (filters.from || filters.to) {
    const timeFilter: Record<string, Date> = { lt: now };
    if (filters.from) timeFilter.gte = new Date(filters.from);
    if (filters.to) timeFilter.lte = new Date(filters.to);
    eventWhere.startTime = timeFilter;
  }

  if (filters.venue) {
    eventWhere.venue = {
      name: { contains: filters.venue, mode: "insensitive" },
    };
  }

  if (filters.q) {
    eventWhere.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { eventType: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  // 2. EXPENSE SEARCH FILTERS
  const expenseWhere: Record<string, unknown> = {};

  if (filters.category) {
    expenseWhere.category = filters.category as ExpenseCategory;
  }

  if (filters.from || filters.to) {
    const timeFilter: Record<string, Date> = {};
    if (filters.from) timeFilter.gte = new Date(filters.from);
    if (filters.to) timeFilter.lte = new Date(filters.to);
    expenseWhere.createdAt = timeFilter;
  }

  if (filters.q) {
    expenseWhere.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      {
        event: {
          title: { contains: filters.q, mode: "insensitive" },
        },
      },
    ];
  }

  // Execute database queries in parallel
  const [events, totalEvents, expenses, totalExpenses] = await Promise.all([
    prisma.event.findMany({
      where: eventWhere,
      skip,
      take: limit,
      orderBy: { startTime: "desc" },
      include: {
        venue: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true } },
        budget: true,
      },
    }),
    prisma.event.count({ where: eventWhere }),
    prisma.expense.findMany({
      where: expenseWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, title: true } },
        receipt: true,
      },
    }),
    prisma.expense.count({ where: expenseWhere }),
  ]);

  return {
    pagination: {
      page,
      limit,
      totalEvents,
      totalExpenses,
      totalPagesEvents: Math.ceil(totalEvents / limit),
      totalPagesExpenses: Math.ceil(totalExpenses / limit),
    },
    events,
    expenses,
  };
}
