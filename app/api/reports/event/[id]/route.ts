import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/src/modules/auth/rbac";
import { getEventSummaryReport } from "@/src/modules/reports/reportService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reports/event/[id]
 * Comprehensive JSON summary of an event including schedule, financials, conflicts, and reviews.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const report = await getEventSummaryReport(id);
    return jsonResponse(report);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "EVENT_NOT_FOUND") {
      return errorResponse("Event not found", 404);
    }
    const message = err instanceof Error ? err.message : "Failed to generate event report";
    return errorResponse(message, 500);
  }
}
