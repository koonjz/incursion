import { NextRequest } from "next/server";
import {
  errorResponse,
  jsonResponse,
  requireAuth,
} from "@/src/modules/auth/rbac";
import {
  deleteExpense,
  updateExpense,
} from "@/src/modules/expenses/expenseService";
import { updateExpenseSchema } from "@/src/modules/expenses/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/expenses/[id]
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.format());
    }

    const updated = await updateExpense(id, parsed.data, user);
    return jsonResponse(updated);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Insufficient permissions", 403);
      if (err.message === "EXPENSE_NOT_FOUND") return errorResponse("Expense not found", 404);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/expenses/[id]
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    await deleteExpense(id, user);
    return jsonResponse({ deleted: true, id });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Insufficient permissions", 403);
      if (err.message === "EXPENSE_NOT_FOUND") return errorResponse("Expense not found", 404);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
