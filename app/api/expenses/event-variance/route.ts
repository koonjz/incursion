import { NextRequest, NextResponse } from "next/server";
import { getEventVarianceData } from "@/src/modules/expenses/claimsService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const event = searchParams.get("event") || undefined;
    const variance = await getEventVarianceData(event);
    return NextResponse.json({ success: true, variance });
  } catch (err) {
    console.error("[GET /api/expenses/event-variance]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
