import { NextRequest } from "next/server";
import {
  errorResponse,
  jsonResponse,
  requireAuth,
} from "@/src/modules/auth/rbac";
import {
  createExpense,
  listExpenses,
} from "@/src/modules/expenses/expenseService";
import { createExpenseSchema } from "@/src/modules/expenses/validation";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";

/**
 * GET /api/expenses
 * List and filter expenses by eventId, category, and status.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || undefined;
    const category = (searchParams.get("category") as ExpenseCategory) || undefined;
    const status = (searchParams.get("status") as ExpenseStatus) || undefined;

    const expenses = await listExpenses({ eventId, category, status });
    return jsonResponse(expenses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch expenses";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/expenses
 * Create expense with budget cap validation.
 * Non-admin users are blocked if the expense exceeds the event's allocated budget.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.format());
    }

    try {
      const expense = await createExpense(parsed.data, user);
      return jsonResponse(expense, 201);
    } catch (createErr: unknown) {
      if (createErr instanceof Error && createErr.message === "OVER_BUDGET_BLOCKED") {
        const errorData = createErr as unknown as {
          budgetDetails: Record<string, number>;
        };
        return errorResponse(
          "Expense exceeds allocated event budget. Only administrators can approve over-budget items.",
          400,
          errorData.budgetDetails
        );
      }
      throw createErr;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "EVENT_NOT_FOUND") return errorResponse("Event not found", 404);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
