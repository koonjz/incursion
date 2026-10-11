import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/src/modules/auth/rbac";
import { getBudgetByCategory } from "@/src/modules/budget/budgetService";

/**
 * GET /api/budget/by-category?eventId=&from=&to=
 * Breakdown ready for Recharts (BarChart/PieChart)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const data = await getBudgetByCategory({ eventId, from, to });
    return jsonResponse(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch category budget";
    return errorResponse(message, 500);
  }
}
