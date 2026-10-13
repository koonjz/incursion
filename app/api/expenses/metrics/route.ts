import { NextResponse } from "next/server";
import { getExpenseMetrics } from "@/src/modules/expenses/claimsService";

export async function GET() {
  try {
    const metrics = await getExpenseMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (err) {
    console.error("[GET /api/expenses/metrics]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
