import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/src/modules/auth/rbac";
import { searchArchive } from "@/src/modules/archive/archiveService";
import { APP_CONFIG } from "@/src/config";

/**
 * GET /api/archive/search?q=&from=&to=&venue=&category=&page=&limit=
 * Search past events and expenses by text, date, venue, category with pagination and sorting.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const venue = searchParams.get("venue") || undefined;
    const category = searchParams.get("category") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(
      searchParams.get("limit") || String(APP_CONFIG.pagination.defaultLimit),
      10
    );

    const results = await searchArchive({
      q,
      from,
      to,
      venue,
      category,
      page,
      limit,
    });

    return jsonResponse(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to search archive";
    return errorResponse(message, 500);
  }
}
