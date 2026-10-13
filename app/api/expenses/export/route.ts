import { NextResponse } from "next/server";
import { listAllClaims, formatClaimsToCSV } from "@/src/modules/expenses/claimsService";

export async function GET() {
  try {
    const { claims } = await listAllClaims({ limit: 1000 });
    const csv = formatClaimsToCSV(claims);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ACM-FIN-2026-Q1.csv"',
      },
    });
  } catch (err) {
    console.error("[GET /api/expenses/export]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
