import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireRole } from "@/src/modules/auth/rbac";
import { generateConflictsCsv } from "@/src/modules/reports/reportService";

/**
 * GET /api/reports/conflicts.csv
 * Streams CSV export of all detected and resolved conflicts for administrative audits.
 * Restricted to ADMIN and HOD roles.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "HOD"], req);

    const csvContent = await generateConflictsCsv();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="conflicts-audit-${Date.now()}.csv"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Only Admins and HODs can export conflict audits", 403);
    }
    const message = err instanceof Error ? err.message : "Failed to generate CSV export";
    return errorResponse(message, 500);
  }
}
