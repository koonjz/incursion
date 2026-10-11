import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireRole } from "@/src/modules/auth/rbac";
import { generateBudgetCsv } from "@/src/modules/reports/reportService";

/**
 * GET /api/reports/budget.csv?from=&to=
 * Streams CSV export of budgets and expenses.
 * Restricted to ADMIN and HOD roles.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "HOD"], req);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const csvContent = await generateBudgetCsv({ from, to });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="budget-report-${Date.now()}.csv"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Only Admins and HODs can export budget reports", 403);
    }
    const message = err instanceof Error ? err.message : "Failed to generate CSV export";
    return errorResponse(message, 500);
  }
}
