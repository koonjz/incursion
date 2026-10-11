import { prisma } from "@/src/lib/prisma";
import { AuthenticatedUser } from "@/src/modules/auth/rbac";
import { CreateExpenseInput, UpdateExpenseInput } from "./validation";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";

/**
 * Creates an expense with budget threshold checking.
 * Blocks if total exceeds event allocated budget, unless current user has ADMIN role.
 */
export async function createExpense(
  input: CreateExpenseInput,
  currentUser: AuthenticatedUser
) {
  // 1. Fetch event and its allocated budget
  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    include: { budget: true },
  });

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }

  const allocatedBudget = event.budget?.allocated ?? 0;

  // 2. Aggregate current spent expenses via Prisma aggregate
  const currentSpentAggregate = await prisma.expense.aggregate({
    where: {
      eventId: input.eventId,
      status: { notIn: [ExpenseStatus.REJECTED] },
    },
    _sum: {
      amount: true,
    },
  });

  const currentSpent = currentSpentAggregate._sum.amount ?? 0;
  const projectedTotal = currentSpent + input.amount;

  // 3. Over-budget verification
  if (allocatedBudget > 0 && projectedTotal > allocatedBudget && currentUser.role !== "ADMIN") {
    const overage = Math.round((projectedTotal - allocatedBudget) * 100) / 100;
    const remaining = Math.max(0, Math.round((allocatedBudget - currentSpent) * 100) / 100);

    const error = new Error("OVER_BUDGET_BLOCKED");
    (error as unknown as { budgetDetails: Record<string, number> }).budgetDetails = {
      allocatedBudget,
      currentSpent,
      attemptedExpense: input.amount,
      remainingBudget: remaining,
      overageAmount: overage,
    };
    throw error;
  }

  // 4. Create the expense
  const expense = await prisma.expense.create({
    data: {
      eventId: input.eventId,
      title: input.title,
      amount: input.amount,
      category: input.category as ExpenseCategory,
      createdById: currentUser.id,
      receiptId: input.receiptId,
      status: ExpenseStatus.APPROVED,
    },
    include: {
      receipt: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return expense;
}

/**
 * Lists expenses with filtering by event, category, and status.
 */
export async function listExpenses(filters: {
  eventId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
}) {
  const where: Record<string, unknown> = {};
  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;

  return await prisma.expense.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      receipt: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      event: {
        select: { id: true, title: true },
      },
    },
  });
}

/**
 * Updates an expense.
 */
export async function updateExpense(
  id: string,
  input: UpdateExpenseInput,
  currentUser: AuthenticatedUser
) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  if (existing.createdById !== currentUser.id && !["ADMIN", "HOD"].includes(currentUser.role)) {
    throw new Error("FORBIDDEN");
  }

  return await prisma.expense.update({
    where: { id },
    data: {
      title: input.title,
      amount: input.amount,
      category: input.category as ExpenseCategory,
      status: input.status as ExpenseStatus,
      receiptId: input.receiptId,
    },
    include: {
      receipt: true,
    },
  });
}

/**
 * Deletes an expense.
 */
export async function deleteExpense(id: string, currentUser: AuthenticatedUser) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  if (existing.createdById !== currentUser.id && !["ADMIN", "HOD"].includes(currentUser.role)) {
    throw new Error("FORBIDDEN");
  }

  return await prisma.expense.delete({ where: { id } });
}
