import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/src/modules/auth/rbac";
import { dryRunConflictCheck } from "@/src/modules/events/eventsService";
import { checkConflictsSchema } from "@/src/modules/events/validation";

/**
 * POST /api/events/check-conflicts
 * Dry run evaluation: returns detected conflicts, score, overall severity, and top 5 suggested slots
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkConflictsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.format());
    }

    const result = await dryRunConflictCheck(parsed.data);
    return jsonResponse(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check conflicts";
    return errorResponse(message, 500);
  }
}
