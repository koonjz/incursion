import { NextResponse } from "next/server";
import { getAllCampusEvents } from "@/lib/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const events = await getAllCampusEvents();
    return NextResponse.json(
      { success: true, data: events },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.error("[GET /api/events/campus]", err);
    return NextResponse.json(
      { success: false, data: [], error: err?.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
