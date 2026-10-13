import { NextRequest, NextResponse } from "next/server";
import { getEventVarianceData } from "@/src/modules/expenses/claimsService";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variance = await getEventVarianceData(id);
    return NextResponse.json({ success: true, variance });
  } catch (err) {
    console.error("[GET /api/expenses/event-variance/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
