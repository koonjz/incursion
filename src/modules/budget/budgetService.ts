import { prisma } from "@/src/lib/prisma";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";

export interface BudgetSummaryFilters {
  eventId?: string;
  from?: string;
  to?: string;
}

/**
 * Computes aggregated budget metrics: allocated, spent, remaining, % used.
 * Uses Prisma aggregate functions without JS row iteration.
 */
export async function getBudgetSummary(filters: BudgetSummaryFilters) {
  // Build time filter
  const eventWhere: Record<string, unknown> = {};
  const expenseWhere: Record<string, unknown> = {
    status: { notIn: [ExpenseStatus.REJECTED] },
  };

  if (filters.eventId) {
    eventWhere.id = filters.eventId;
    expenseWhere.eventId = filters.eventId;
  }

  if (filters.from || filters.to) {
    const timeFilter: Record<string, Date> = {};
    if (filters.from) timeFilter.gte = new Date(filters.from);
    if (filters.to) timeFilter.lte = new Date(filters.to);
    eventWhere.startTime = timeFilter;
    expenseWhere.createdAt = timeFilter;
  }

  // 1. Aggregate total budget allocated across matching events
  const budgetAggregate = await prisma.budget.aggregate({
    where: {
      event: eventWhere,
    },
    _sum: {
      allocated: true,
    },
    _count: {
      id: true,
    },
  });

  // 2. Aggregate total spent across matching expenses
  const expenseAggregate = await prisma.expense.aggregate({
    where: expenseWhere,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const totalAllocated = budgetAggregate._sum.allocated ?? 0;
  const totalSpent = expenseAggregate._sum.amount ?? 0;
  const remaining = Math.max(0, Math.round((totalAllocated - totalSpent) * 100) / 100);
  const percentageUsed =
    totalAllocated > 0
      ? Math.min(100, Math.round((totalSpent / totalAllocated) * 1000) / 10)
      : 0;

  return {
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remaining,
    percentageUsed,
    eventCount: budgetAggregate._count.id,
    expenseCount: expenseAggregate._count.id,
    isOverBudget: totalSpent > totalAllocated && totalAllocated > 0,
  };
}

/**
 * Breakdown of expenses by category formatted directly for Recharts (BarChart/PieChart).
 * Uses Prisma groupBy on the category column.
 */
export async function getBudgetByCategory(filters: BudgetSummaryFilters) {
  const where: Record<string, unknown> = {
    status: { notIn: [ExpenseStatus.REJECTED] },
  };

  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.from || filters.to) {
    const timeFilter: Record<string, Date> = {};
    if (filters.from) timeFilter.gte = new Date(filters.from);
    if (filters.to) timeFilter.lte = new Date(filters.to);
    where.createdAt = timeFilter;
  }

  const categoryAggregates = await prisma.expense.groupBy({
    by: ["category"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
  });

  // Format array ready for Recharts: [{ name: "VENUE", value: 1250, count: 5 }]
  return categoryAggregates.map((item) => ({
    category: item.category,
    name: formatCategoryLabel(item.category),
    amount: item._sum.amount ?? 0,
    value: item._sum.amount ?? 0,
    count: item._count.id,
  }));
}

/**
 * Monthly trend of expenses ready for Recharts LineChart/AreaChart.
 * Aggregates across last 6 or 12 months using database queries.
 */
export async function getBudgetMonthlyTrend(filters: { months?: number; eventId?: string } = {}) {
  const monthsCount = filters.months || 6;
  const now = new Date();
  const trendData = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const where: Record<string, unknown> = {
      status: { notIn: [ExpenseStatus.REJECTED] },
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    if (filters.eventId) where.eventId = filters.eventId;

    const aggregate = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    const monthLabel = startOfMonth.toLocaleString("en-US", { month: "short", year: "2-digit" });

    trendData.push({
      month: monthLabel,
      spent: aggregate._sum.amount ?? 0,
      count: aggregate._count.id,
    });
  }

  return trendData;
}

function formatCategoryLabel(category: ExpenseCategory): string {
  switch (category) {
    case "VENUE":
      return "Venue & Hall";
    case "EQUIPMENT":
      return "Audio & Equipment";
    case "CATERING":
      return "Food & Catering";
    case "MARKETING":
      return "Design & Marketing";
    case "TRAVEL":
      return "Travel & Logistics";
    case "PRIZES":
      return "Awards & Prizes";
    case "MISCELLANEOUS":
      return "Miscellaneous";
    default:
      return category;
  }
}
