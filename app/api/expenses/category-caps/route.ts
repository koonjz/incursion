import { NextResponse } from "next/server";
import { getCategoryCaps } from "@/src/modules/expenses/claimsService";

export async function GET() {
  try {
    const categories = await getCategoryCaps();
    return NextResponse.json({ success: true, categories });
  } catch (err) {
    console.error("[GET /api/expenses/category-caps]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
