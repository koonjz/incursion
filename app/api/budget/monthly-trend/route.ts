import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/src/modules/auth/rbac";
import { getBudgetMonthlyTrend } from "@/src/modules/budget/budgetService";

/**
 * GET /api/budget/monthly-trend?months=6&eventId=
 * Monthly trend data ready for Recharts (LineChart/AreaChart)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthsParam = searchParams.get("months");
    const eventId = searchParams.get("eventId") || undefined;
    const months = monthsParam ? parseInt(monthsParam, 10) : 6;

    const trend = await getBudgetMonthlyTrend({ months, eventId });
    return jsonResponse(trend);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch monthly trend";
    return errorResponse(message, 500);
  }
}
