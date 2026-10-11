import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/src/modules/auth/rbac";
import { getBudgetSummary } from "@/src/modules/budget/budgetService";

/**
 * GET /api/budget/summary?eventId=&from=&to=
 * Returns aggregate allocated vs spent vs remaining, % used
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const summary = await getBudgetSummary({ eventId, from, to });
    return jsonResponse(summary);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch budget summary";
    return errorResponse(message, 500);
  }
}
