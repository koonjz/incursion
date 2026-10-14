import { NextResponse } from "next/server";
import { getAllCampusEvents } from "@/lib/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const events = await getAllCampusEvents();
    return NextResponse.json({ success: true, data: events });
  } catch (err: any) {
    console.error("[GET /api/events/campus]", err);
    return NextResponse.json({ success: false, data: [], error: err?.message }, { status: 500 });
  }
}
